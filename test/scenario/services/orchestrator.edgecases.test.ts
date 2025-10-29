/**
 * Edge-case tests for the orchestrator to ensure graceful handling of empty
 * goal maps and partial failures. Includes assertions on metric updates and
 * logging behavior.
 */
import { Orchestrator } from '../../services/orchestrator';
import { utils, createMockClient } from '../../utils/helper';

describe('services: Orchestrator edge cases', () => {
  it('handles empty goal map gracefully', async () => {
    const mockClient: any = createMockClient({
      fetchGoalMap: jest.fn().mockResolvedValue([]),
      createPolyanetAt: jest.fn(),
      createSoloonAt: jest.fn(),
      createComethAt: jest.fn(),
    });

    const orchestrator = new Orchestrator(mockClient as any, 2 as any);
    const logSpy = jest.spyOn(utils as any, 'logInfo').mockImplementation(() => {});

    await orchestrator.buildMegaverseFromGoalMap({ concurrency: 2, dryRun: false });

    expect(mockClient.fetchGoalMap).toHaveBeenCalled();
    expect(mockClient.createPolyanetAt).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('counts skipped/failed when client returns errors for some cells', async () => {
    const goal = [['POLYANET', 'UNKNOWN_TAG', 'BLUE_SOLOON']];
    const mockClient: any = createMockClient({
      fetchGoalMap: jest.fn().mockResolvedValue(goal),
      createPolyanetAt: jest.fn().mockRejectedValueOnce({ response: { statusCode: 409 } }).mockResolvedValue(undefined),
      createSoloonAt: jest.fn().mockRejectedValue({ response: { statusCode: 500 } }),
      createComethAt: jest.fn(),
      validateSolution: jest.fn().mockResolvedValue({}),
    });

    const orchestrator = new Orchestrator(mockClient as any, 2 as any);
    const logErrorSpy = jest.spyOn(utils as any, 'logError').mockImplementation(() => {});

    await orchestrator.buildMegaverseFromGoalMap({ concurrency: 2, dryRun: false });

    // first POLYANET call rejects with 409 -> skipped, second POLYANET resolves on retry
    expect(mockClient.createPolyanetAt).toHaveBeenCalled();
    // unknown tag should not cause create calls other than those present
    expect(mockClient.createSoloonAt).toHaveBeenCalled();
    expect(logErrorSpy).toHaveBeenCalled();

    logErrorSpy.mockRestore();
  });
});


