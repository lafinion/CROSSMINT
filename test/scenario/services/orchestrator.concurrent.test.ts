/**
 * Concurrency tests that verify the orchestrator imposes limits specified by
 * the caller. The tests instrument active call counting to ensure the number
 * of concurrent operations does not exceed the configured limit.
 */
import { Orchestrator } from '../../services/orchestrator';
import { createMockClient } from '../../utils/helper';

describe('services: Orchestrator concurrency', () => {
  it('limits concurrent creation to specified concurrency', async () => {
    const calls: Array<Promise<void>> = [];
    let active = 0;
    let maxActive = 0;

    const mockClient: any = createMockClient({
      createPolyanetAt: () => {
        const p = new Promise<void>(resolve => {
          active++;
          maxActive = Math.max(maxActive, active);
          setTimeout(() => {
            active--;
            resolve();
          }, 50);
        });
        calls.push(p);
        return p;
      },
      createSoloonAt: async () => {},
      createComethAt: async () => {},
      fetchGoalMap: async () => [['POLYANET','POLYANET','POLYANET','POLYANET','POLYANET']] as any,
      validateSolution: async () => ({})
    });

    const orchestrator = new Orchestrator(mockClient as any, undefined as any);
    await orchestrator.buildMegaverseFromGoalMap({ concurrency: 2, dryRun: false });
    // wait for any pending calls
    await Promise.all(calls);
    expect(maxActive).toBeLessThanOrEqual(2);
  }, 10000);
});


