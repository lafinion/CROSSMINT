#!/usr/bin/env node
/**
 * CLI entrypoint used by the test-suite to drive orchestrator flows.
 *
 * Supports several commands used during testing: `phase1`, `phase2` and
 * `validate`. Flags may be passed as `--key=value` or `--flag`.
 */
import { orchestrator } from '../services/orchestrator';
import { utils } from '../utils/helper';
import { crossmintClient } from '../api/instances';

/**
 * Parse CLI flags in the form `--key=value` or `--flag` into an object.
 * Flags without values are assigned `true`.
 *
 * @param argv - Array of tokens to scan for flags.
 * @returns Record of parsed flags.
 */
function parseFlags(argv: string[]) {
  const flags: Record<string, string | boolean> = {};
  for (const token of argv) {
    // Only consider tokens starting with `--` as flags.
    if (!token.startsWith('--')) continue;
    const [k, v] = token.slice(2).split('=');
    // If no value provided, set flag to true to indicate presence.
    flags[k] = v === undefined ? true : v;
  }
  return flags;
}

/**
 * Main CLI dispatcher.
 *
 * Recognized commands:
 * - `phase1 [size|--size=N] [--concurrency=N] [--dry-run]`
 * - `phase2 [--concurrency=N] [--dry-run]`
 * - `validate`
 */
async function main() {
  const [, , command, arg, ...rest] = process.argv;

  // Merge flags passed after the command and a single positional arg which may
  // be used as a size parameter for `phase1`.
  const flags = parseFlags(rest.concat(arg ? [arg] : []));
  if (!command) {
    utils.printUsage();
    process.exit(1);
  }

  try {
    if (command === 'phase1') {
      // Determine size from `--size` flag, else positional `arg`, else default
      // to 15. Accept both `--size=N` and `N` forms for convenience.
      const size = flags.size ? Number(flags.size) : arg && !arg.startsWith('--') ? Number(arg) : 15;

      // Optional concurrency setting; undefined means orchestrator defaults.
      const concurrency = flags.concurrency ? Number(flags.concurrency) : undefined;

      // Dry-run can be specified as `--dry-run` or `--dry`.
      const dryRun = !!flags['dry-run'] || !!flags.dry;

      await orchestrator.drawXPattern(size, { concurrency, dryRun });
      utils.logInfo('Phase1 complete');
      process.exit(0);
    }

    if (command === 'phase2') {
      const concurrency = flags.concurrency ? Number(flags.concurrency) : undefined;
      const dryRun = !!flags['dry-run'] || !!flags.dry;
      await orchestrator.buildMegaverseFromGoalMap({ concurrency, dryRun });
      utils.logInfo('Phase2 complete');
      process.exit(0);
    }

    if (command === 'validate') {
      // Validate current map on server and print results.
      const result = await crossmintClient.validateSolution();
      utils.logInfo(`Validate result: ${JSON.stringify(result)}`);
      process.exit(0);
    }

    // Unknown command: print usage and exit with failure.
    utils.printUsage();
    process.exit(1);
  } catch (error) {
    // Catch all to ensure CLI exits with a non-zero code on unexpected errors.
    utils.logError('Error running command', error);
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}


