/**
 * Integration-like flow tests that combine building and validation steps with
 * a mocked crossmint client to assert end-to-end orchestration behavior.
 */
import { orchestrator } from '../../services/orchestrator';
import * as instances from '../../api/instances';

describe('integration: integration-like flow (mocked client)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('builds from mocked goal and then validates via client', async () => {
    const goal = [['POLYANET', 'BLUE_SOLOON'], ['LEFT_COMETH', null]];
    jest.spyOn(instances.crossmintClient, 'fetchGoalMap').mockResolvedValue(goal as any);
    const p1 = jest.spyOn(instances.crossmintClient, 'createPolyanetAt').mockResolvedValue(undefined as any);
    const p2 = jest.spyOn(instances.crossmintClient, 'createSoloonAt').mockResolvedValue(undefined as any);
    const p3 = jest.spyOn(instances.crossmintClient, 'createComethAt').mockResolvedValue(undefined as any);
    const validateMock = jest.spyOn(instances.crossmintClient, 'validateSolution').mockResolvedValue({ solved: true } as any);

    await orchestrator.buildMegaverseFromGoalMap({ concurrency: 2, dryRun: false });
    const res = await instances.crossmintClient.validateSolution();

    expect(p1).toHaveBeenCalled();
    expect(p2).toHaveBeenCalled();
    expect(p3).toHaveBeenCalled();
    expect(validateMock).toHaveBeenCalled();
    expect(res).toBeDefined();
  });
});


