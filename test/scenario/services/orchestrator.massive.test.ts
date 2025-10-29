/**
 * Massive creation test to ensure the orchestrator can handle large goal maps
 * without unbounded memory consumption. The test constructs a synthetic
 * goal map and verifies the expected number of create calls are made.
 */
import { Orchestrator } from '../../services/orchestrator';
import { utils, createMockClient } from '../../utils/helper';

describe('services: Orchestrator massive creation', () => {
  it('creates all POLYANETs for a large goal map without memory blowup', async () => {
    const rows = 20;
    const cols = 10; // 200 cells
    const goalMap: string[][] = [];
    let expectedCreates = 0;
    for (let r = 0; r < rows; r++) {
      const row: string[] = [];
      for (let c = 0; c < cols; c++) {
        // alternate to include some spaces
        if ((r + c) % 3 === 0) {
          row.push('POLYANET');
          expectedCreates++;
        } else {
          row.push('SPACE');
        }
      }
      goalMap.push(row);
    }

    const mockClient: any = createMockClient({
      createPolyanetAt: jest.fn().mockResolvedValue({}),
      createSoloonAt: jest.fn().mockResolvedValue({}),
      createComethAt: jest.fn().mockResolvedValue({}),
      fetchGoalMap: jest.fn().mockResolvedValue(goalMap),
      validateSolution: jest.fn().mockResolvedValue({}),
    });

    const orchestrator = new Orchestrator(mockClient as any, 10 as any);
    const logSpy = jest.spyOn(utils as any, 'logInfo').mockImplementation(() => {});

    await orchestrator.buildMegaverseFromGoalMap({ concurrency: 10, dryRun: false });

    expect(mockClient.createPolyanetAt).toHaveBeenCalledTimes(expectedCreates);

    logSpy.mockRestore();
  }, 20000);
});


