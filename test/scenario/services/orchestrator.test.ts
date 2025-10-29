/**
 * Behavioral tests for the orchestrator's `buildMegaverseFromGoalMap` using
 * the shared `orchestrator` instance. These tests validate dry-run behavior
 * and actual creation flows against the `instances.crossmintClient` mocks.
 */
import { orchestrator } from '../../services/orchestrator';
import * as instances from '../../api/instances';

describe('services: Orchestrator buildMegaverseFromGoalMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dry-run does not call create methods but logs', async () => {
    const fetchMock = jest.spyOn(instances.crossmintClient, 'fetchGoalMap').mockResolvedValue([
      ['POLYANET', 'BLUE_SOLOON'],
      ['LEFT_COMETH', null],
    ] as any);
    const p1 = jest.spyOn(instances.crossmintClient, 'createPolyanetAt');
    const p2 = jest.spyOn(instances.crossmintClient, 'createSoloonAt');
    const p3 = jest.spyOn(instances.crossmintClient, 'createComethAt');
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    await orchestrator.buildMegaverseFromGoalMap({ concurrency: 2, dryRun: true });

    expect(fetchMock).toHaveBeenCalled();
    expect(p1).not.toHaveBeenCalled();
    expect(p2).not.toHaveBeenCalled();
    expect(p3).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalled();
  });

  it('creates objects for goal map', async () => {
    const fetchMock = jest.spyOn(instances.crossmintClient, 'fetchGoalMap').mockResolvedValue([
      ['POLYANET', 'BLUE_SOLOON'],
    ] as any);
    const p1 = jest.spyOn(instances.crossmintClient, 'createPolyanetAt').mockResolvedValue(undefined as any);
    const p2 = jest.spyOn(instances.crossmintClient, 'createSoloonAt').mockResolvedValue(undefined as any);

    await orchestrator.buildMegaverseFromGoalMap({ concurrency: 2, dryRun: false });

    expect(fetchMock).toHaveBeenCalled();
    expect(p1).toHaveBeenCalledTimes(1);
    expect(p2).toHaveBeenCalledTimes(1);
  });
});


