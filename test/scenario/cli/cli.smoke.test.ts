/**
 * Smoke tests for the CLI entrypoint. These tests run the script in
 * a subprocess to ensure the commands exit with expected status codes and
 * output when run in dry-run mode.
 */
import { spawnSync } from 'child_process';
import path from 'path';

describe('cli: CLI smoke tests', () => {
  const node = process.execPath;
  const cliPath = path.resolve(__dirname, '..', '..', 'scripts', 'cli.ts');

  it('runs phase1 in dry-run mode and exits 0', () => {
    const res = spawnSync(node, ['-r', 'ts-node/register', cliPath, 'phase1', '--dry-run'], {
      env: { ...process.env },
      encoding: 'utf8',
      timeout: 10000,
    });
    expect(res.status).toBe(0);
    expect(res.stdout).toEqual(expect.stringContaining('Phase1 complete'));
  });

  it('runs phase2 in dry-run mode and exits 0', () => {
    const res = spawnSync(node, ['-r', 'ts-node/register', cliPath, 'phase2', '--dry-run'], {
      env: { ...process.env },
      encoding: 'utf8',
      timeout: 10000,
    });
    expect(res.status).toBe(0);
    expect(res.stdout).toEqual(expect.stringContaining('Phase2 complete'));
  });
});


