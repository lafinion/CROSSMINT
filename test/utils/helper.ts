import { MAX_CONCURRENCY, RETRY_MAX_ATTEMPTS, RETRY_BASE_DELAY_MS } from '../config';

/**
 * Create a simple concurrency limiter.
 *
 * The returned function wraps an async task and schedules its execution so
 * that at most `maxConcurrency` tasks run in parallel. Tasks are queued and
 * executed in FIFO order when slots become available.
 *
 * @param maxConcurrency - Maximum number of concurrent tasks.
 */
// Removed top-level createLimiter in favor of instance method on `Utils`.

/**
 * Small utility collection used across tests: concurrency limiter, retry
 * strategy, and simple logging helpers.
 */
export class Utils {
  public readonly concurrencyLimiter: ReturnType<Utils['createLimiter']>;

  /**
   * @param maxConcurrency - Default maximum concurrency used by helpers.
   */
  constructor(maxConcurrency = MAX_CONCURRENCY) {
    this.concurrencyLimiter = this.createLimiter(maxConcurrency);
  }

  /**
   * Retry an async operation with exponential backoff.
   *
   * The function retries on transient HTTP-like errors (status 429 or 5xx)
   * and also on unknown errors (no status), up to `maxRetries`. Backoff uses
   * a simple exponential strategy: delay = 2^attempt * baseDelayMs.
   *
   * Awaiting inside the loop is intentional so that retries are applied
   * sequentially with delays between attempts.
   *
   * @template T
   * @param operation - Async operation to attempt.
   * @param maxRetries - Maximum number of retry attempts.
   * @param baseDelayMs - Base delay in milliseconds used for backoff.
   * @returns The operation result when successful.
   * @throws The last error if retries are exhausted or a non-retriable error occurs.
   */
  public async retryWithExponentialBackoff<T>(operation: () => Promise<T>, maxRetries = RETRY_MAX_ATTEMPTS, baseDelayMs = RETRY_BASE_DELAY_MS) {
    let attemptCount = 0;
    type ErrWithStatus = { response?: { statusCode?: number }; statusCode?: number };
    while (attemptCount <= maxRetries) {
      try {
        // awaiting here is intentional so that we catch errors and apply retry logic
        // eslint-disable-next-line no-await-in-loop
        return await operation();
      } catch (err: unknown) {
        attemptCount++;
        // Extract status code if available from common error shapes.
        const statusCode = ((err as ErrWithStatus).response?.statusCode) ?? (err as ErrWithStatus).statusCode;

        // Decide whether this error should be retried:
        // - 429 (rate limit) should be retried
        // - 5xx server errors should be retried
        // - undefined status (non-HTTP errors) are considered retriable
        const shouldAttemptRetry = attemptCount <= maxRetries && (statusCode === 429 || (statusCode !== undefined && statusCode >= 500 && statusCode < 600) || statusCode === undefined);
        if (!shouldAttemptRetry) throw err;

        // Exponential backoff: 2^attemptCount * baseDelayMs
        const delayMs = Math.pow(2, attemptCount) * baseDelayMs;
        // awaiting inside retry loop is intentional to back off between attempts
        // eslint-disable-next-line no-await-in-loop
        await new Promise(resolve => setTimeout(resolve, delayMs));
        // Continue to next attempt
      }
    }
    throw new Error('Operation failed after maximum retry attempts');
  }

  public printUsage() {
    console.log('Usage:');
    console.log('  node ./dist/cli.js phase1 [size]  # draw X pattern (size optional)');
    console.log('  node ./dist/cli.js phase2         # build from goal map');
  }

  public logInfo(message: string): void {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`);
  }

  public logError(message: string, error?: unknown): void {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error);
  }
  /**
   * Create a jest spy that mocks global.fetch with a sequence of responses.
   * Each entry in `responses` may be either a value (resolved) or a function
   * returning a Promise (for throwing or custom logic). The spy should be
   * restored by the caller when no longer needed (`spy.mockRestore()`).
   *
   * @param responses - Array of response values or functions producing a Promise.
   * @returns The jest spy instance for `global.fetch`.
   */
  public mockFetchSequence(responses: Array<any>) {
    let call = 0;
    const spy = jest.spyOn(global as any, 'fetch').mockImplementation((..._args: any[]) => {
      // reference to avoid unused var linting
      void _args;
      const r = responses[call] ?? responses[responses.length - 1];
      call++;
      if (typeof r === 'function') return r();
      return Promise.resolve(r);
    });
    return spy;
  }

  /**
   * Create a simple concurrency limiter bound to `maxConcurrency`.
   * Returned function schedules tasks and ensures no more than
   * `maxConcurrency` run at once.
   */
  public createLimiter(maxConcurrency: number) {
    let active = 0;
    const queue: Array<() => void> = [];

    const runNext = () => {
      if (queue.length === 0 || active >= maxConcurrency) return;
      active++;
      const fn = queue.shift()!;
      fn();
    };

    return function <T> (fn: () => Promise<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        const task = () => {
          fn()
            .then(res => resolve(res))
            .catch(reject)
            .finally(() => {
              active--;
              runNext();
            });
        };
        queue.push(task);
        runNext();
      });
    };
  }
}

export const utils = new Utils(MAX_CONCURRENCY);

/**
 * Create a reusable mock client for tests with sensible defaults. Tests can
 * override any method by passing an `overrides` object.
 *
 * Example:
 * const mockClient = createMockClient({ fetchGoalMap: jest.fn().mockResolvedValue(goal) });
 */
export function createMockClient(overrides: Partial<Record<string, any>> = {}) {
  const defaults: Record<string, any> = {
    createPolyanetAt: jest.fn().mockResolvedValue({}),
    createSoloonAt: jest.fn().mockResolvedValue({}),
    createComethAt: jest.fn().mockResolvedValue({}),
    fetchGoalMap: jest.fn().mockResolvedValue([]),
    validateSolution: jest.fn().mockResolvedValue({}),
  };
  return { ...defaults, ...overrides };
}
