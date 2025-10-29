/**
 * Full flow validation tests using a mocked client. These tests assert that
 * the orchestrator creates expected objects and that `validateSolution`
 * returns the expected solved state.
 */
import { orchestrator } from '../../services/orchestrator';
import * as instances from '../../api/instances';

describe('integration: validate flow (mocked client) full scenarios', () => {
  beforeEach(() => jest.clearAllMocks());

  it('runs full build and validate returns solved=true', async () => {
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
    expect(res).toEqual({ solved: true });
  });

  it('validate returns solved=false and flow still completes without throwing', async () => {
    const goal = [['POLYANET']];
    jest.spyOn(instances.crossmintClient, 'fetchGoalMap').mockResolvedValue(goal as any);
    const p1 = jest.spyOn(instances.crossmintClient, 'createPolyanetAt').mockResolvedValue(undefined as any);
    const validateMock = jest.spyOn(instances.crossmintClient, 'validateSolution').mockResolvedValue({ solved: false } as any);

    await orchestrator.buildMegaverseFromGoalMap({ concurrency: 1, dryRun: false });
    const res = await instances.crossmintClient.validateSolution();

    expect(p1).toHaveBeenCalledTimes(1);
    expect(validateMock).toHaveBeenCalled();
    expect(res).toEqual({ solved: false });
  });
});


