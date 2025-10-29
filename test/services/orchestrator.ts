import { crossmintClient } from '../api/instances';
import { utils } from '../utils/helper';
import type { ICrossmintClient } from '../interfaces/ICrossmintClient';
import type { ILogger } from '../interfaces/ILogger';
import type { IMetrics } from '../interfaces/IMetrics';
import type { IOrchestratorOptions } from '../interfaces/IOrchestratorOptions';

/**
 * Orchestrator coordinates higher-level test operations that build maps on the
 * server using the `ICrossmintClient` API surface. It provides helpers to draw
 * an X pattern and to build the full megaverse from a goal map while tracking
 * simple metrics about created/skipped/failed operations.
 */
export class Orchestrator {
  private client: ICrossmintClient = crossmintClient;
  private defaultConcurrency?: number;
  // simple metrics tracked during build operations
  private created = 0;
  private skipped = 0;
  private failed = 0;

  /**
   * @param client - Optional client implementation; defaults to test instance.
   * @param defaultConcurrency - Optional concurrency hint used by methods.
   */
  constructor(client?: ICrossmintClient, defaultConcurrency?: number, logger?: ILogger, metrics?: IMetrics) {
    this.client = client || crossmintClient;
    this.defaultConcurrency = defaultConcurrency;
    if (logger) this.logger = logger;
    if (metrics) this.metrics = metrics;
  }

  /**
   * Resolve an appropriate limiter based on explicit concurrency or fall back
   * to a shared limiter utility.
   */
  private getLimiter(concurrency?: number) {
    return concurrency ? utils.createLimiter(concurrency) : utils.concurrencyLimiter;
  }

  // default logger and metrics backed by utils and in-memory counters
  private logger: ILogger = {
    logInfo: (m: string) => utils.logInfo(m),
    logError: (m: string, e?: unknown) => utils.logError(m, e),
  };

  private metrics: IMetrics = {
    incCreated: () => { this.created++; },
    incSkipped: () => { this.skipped++; },
    incFailed: () => { this.failed++; },
    snapshot: () => ({ created: this.created, skipped: this.skipped, failed: this.failed }),
    reset: () => { this.created = 0; this.skipped = 0; this.failed = 0; },
  };

  /**
   * Draw an X-shaped pattern of polyanets across a square map of `mapSize`.
   *
   * Uses a bounded concurrency strategy: tasks are created through a limiter
   * and accumulated in `pending`. Once the pending list reaches `batchSize`,
   * the function waits for the current batch to settle before continuing.
   * This prevents an unbounded number of outstanding promises which could
   * otherwise spike memory usage.
   *
   * @param mapSize - Size of the square map (default 15).
   * @param options - Optional settings: `concurrency` and `dryRun`.
   */
  public async drawXPattern(mapSize = 15, options?: IOrchestratorOptions) {
    const concurrency = options?.concurrency ?? this.defaultConcurrency;
    const dryRun = options?.dryRun ?? false;
    const limiter = this.getLimiter(concurrency);

    const pending: Array<Promise<unknown>> = [];
    // batchSize bounds the number of outstanding promises to avoid memory spikes
    const effectiveConcurrency = concurrency ?? this.defaultConcurrency ?? 5;
    const batchSize = Math.max(effectiveConcurrency * 10, 10);

    for (let rowIndex = 0; rowIndex < mapSize; rowIndex++) {
      const leftColumn = rowIndex;
      const rightColumn = mapSize - 1 - rowIndex;
      if (dryRun) {
        // In dry-run mode only log intended actions.
        this.logger.logInfo(`[dry-run] would create POLYANET at ${rowIndex},${leftColumn}`);
        if (rightColumn !== leftColumn) this.logger.logInfo(`[dry-run] would create POLYANET at ${rowIndex},${rightColumn}`);
        continue;
      }

      // Schedule creation via limiter to bound concurrency.
      pending.push(limiter(() => this.client.createPolyanetAt({ row: rowIndex, column: leftColumn })));
      if (rightColumn !== leftColumn) pending.push(limiter(() => this.client.createPolyanetAt({ row: rowIndex, column: rightColumn })));

      if (pending.length >= batchSize) {
        // wait for current batch to finish before accumulating more promises
        // eslint-disable-next-line no-await-in-loop
        await Promise.all(pending);
        // Clear pending array in-place to avoid reallocations in hot loops.
        pending.length = 0;
      }
    }

    if (pending.length > 0) {
      await Promise.all(pending);
    }
  }

  /**
   * Build the megaverse according to the goal map fetched from the server.
   *
   * The method processes the goal map row by row and schedules bounded tasks
   * for each non-empty cell using the configured limiter. After each row the
   * function waits for the row's tasks to finish which keeps memory usage and
   * concurrency predictable.
   *
   * @param options - Optional settings: `concurrency` and `dryRun`.
   */
  public async buildMegaverseFromGoalMap(options?: { concurrency?: number; dryRun?: boolean }) {
    const concurrency = options?.concurrency ?? this.defaultConcurrency;
    const dryRun = options?.dryRun ?? false;
    const limiter = this.getLimiter(concurrency);
    const goalMap = (await this.client.fetchGoalMap()) as string[][];

    // reset metrics
    this.created = 0;
    this.skipped = 0;
    this.failed = 0;

    for (let rowIndex = 0; rowIndex < goalMap.length; rowIndex++) {
      const rowTasks: Array<Promise<unknown>> = [];
      for (let colIndex = 0; colIndex < goalMap[rowIndex].length; colIndex++) {
        const cellTag = goalMap[rowIndex][colIndex];
        if (!cellTag) continue;
        // schedule bounded task that processes a single cell
        rowTasks.push(limiter(() => this.processCell(rowIndex, colIndex, cellTag, dryRun)));
      }
      // wait for this row to finish before proceeding to next row — bounds memory
      await Promise.all(rowTasks);
      if ((rowIndex + 1) % 5 === 0) {
        const s = this.metrics.snapshot();
        this.logger.logInfo(`Progress: processed ${rowIndex + 1}/${goalMap.length} rows — created=${s.created}, skipped=${s.skipped}, failed=${s.failed}`);
      }
    }

    const final = this.metrics.snapshot();
    this.logger.logInfo(`Build complete — created=${final.created}, skipped=${final.skipped}, failed=${final.failed}`);
  }

  /**
   * Process a single cell tag at row/col. Centralizes creation logic and
   * metric updates so callers don't duplicate behavior.
   *
   * The method recognizes three main tag patterns:
   * - `POLYANET` — create a polyanet
   * - `<color>_SOLOON` — create a soloon with color parsed from the tag
   * - `<direction>_COMETH` — create a cometh with direction parsed from the tag
   *
   * It treats some HTTP error statuses as non-fatal (e.g. 400, 409, 404)
   * incrementing `skipped`; other errors are counted as `failed` and logged.
   */
  private async processCell(rowIndex: number, colIndex: number, cellTag: string, dryRun: boolean) {
    try {
      if (cellTag === 'POLYANET') {
        if (dryRun) {
          utils.logInfo(`[dry-run] would create POLYANET at ${rowIndex},${colIndex}`);
        } else {
          await this.client.createPolyanetAt({ row: rowIndex, column: colIndex });
        }
        this.created++;
        return;
      }

      if (cellTag.endsWith('_SOLOON')) {
        // Extract the color prefix (e.g. BLUE_SOLOON -> blue)
        const color = cellTag.split('_')[0].toLowerCase() as import('../interfaces/models').SoloonColor;
        if (dryRun) {
          utils.logInfo(`[dry-run] would create SOLOON(${color}) at ${rowIndex},${colIndex}`);
        } else {
          await this.client.createSoloonAt({ row: rowIndex, column: colIndex, color });
        }
        this.created++;
        return;
      }

      if (cellTag.endsWith('_COMETH')) {
        // Extract the direction prefix (e.g. NORTH_COMETH -> north)
        const direction = cellTag.split('_')[0].toLowerCase() as import('../interfaces/models').ComethDirection;
        if (dryRun) {
          utils.logInfo(`[dry-run] would create COMETH(${direction}) at ${rowIndex},${colIndex}`);
        } else {
          await this.client.createComethAt({ row: rowIndex, column: colIndex, direction });
        }
        this.created++;
        return;
      }
    } catch (err: any) {
      // Treat common expected HTTP errors as non-fatal and count them as skipped
      const status = err?.response?.statusCode || err?.statusCode;
      if (status === 400 || status === 409 || status === 404) {
        this.skipped++;
        return;
      }
      // Unexpected errors are counted and logged for diagnostics.
      this.failed++;
      utils.logError(`Failed to create object at ${rowIndex},${colIndex}: ${err?.message || err}`);
    }
  }
}

export const orchestrator = new Orchestrator();



