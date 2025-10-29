/**
 * Tests for `drawXPattern` ensuring dry-run behavior and correct number of
 * polyanet creations for a given map size.
 */
import { Orchestrator } from '../../services/orchestrator';
import { utils, createMockClient } from '../../utils/helper';

describe('services: Orchestrator drawXPattern tests', () => {
  it('dry-run logs without calling API', async () => {
    const mockClient: any = createMockClient({ createPolyanetAt: jest.fn() });
    const orchestrator = new Orchestrator(mockClient as any);
    const logSpy = jest.spyOn(utils as any, 'logInfo').mockImplementation(() => {});

    await orchestrator.drawXPattern(5, { concurrency: 2, dryRun: true });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[dry-run] would create POLYANET at'));
    expect(mockClient.createPolyanetAt).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });

  it('creates correct number of polyanets', async () => {
    const mockClient: any = createMockClient({ createPolyanetAt: jest.fn().mockResolvedValue({}) });
    const orchestrator = new Orchestrator(mockClient as any, 2 as any);

    await orchestrator.drawXPattern(3, { concurrency: 2, dryRun: false });

    // For size=3 expected polyanets: (0,0),(0,2),(1,1),(2,0),(2,2) => 5
    expect(mockClient.createPolyanetAt).toHaveBeenCalledTimes(5);
  });
});


