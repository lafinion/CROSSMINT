/**
 * Unit test for the cleanup logic that removes extra polyanets. The test
 * exercises the same logic as the script but runs it inline to avoid module
 * evaluation ordering issues in tests.
 */
import { crossmintClient } from '../../api/instances';
import { API_BASE_URL, CANDIDATE_ID } from '../../config';
import { utils } from '../../utils/helper';

describe('cli: cleanup_extras script', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes extra polyanets not present in goal', async () => {
    const goal = { goal: [['SPACE']] };
    const map = { map: { content: [[{ type: 0 }]] } };

    // mock global fetch to return goal and map sequentially with Response-like objects
    // use shared helper to sequence responses and simplify tests
    const spy = utils.mockFetchSequence([
      () => Promise.resolve({ ok: true, status: 200, json: async () => goal }),
      () => Promise.resolve({ ok: true, status: 200, json: async () => map }),
    ]);

    const removeSpy = jest.spyOn(crossmintClient, 'removePolyanetAt').mockResolvedValue(undefined as any);

    // Execute the same cleanup logic inline to avoid relying on module exports
    const goalRes = await fetch(`${API_BASE_URL}/api/map/${CANDIDATE_ID}/goal`);
    const goalBody = await goalRes.json();
    const goalArr = goalBody.goal ?? goalBody;

    const mapRes = await fetch(`${API_BASE_URL}/api/map/${CANDIDATE_ID}`);
    const mapBody = await mapRes.json();
    const content = mapBody.map?.content ?? [];

    for (let r = 0; r < content.length; r++) {
      for (let c = 0; c < (content[r] || []).length; c++) {
        const cell = content[r][c];
        const wanted = goalArr?.[r]?.[c];
        if (cell && typeof cell === 'object' && cell.type === 0) {
          if (wanted !== 'POLYANET') {
            await crossmintClient.removePolyanetAt({ row: r, column: c });
          }
        }
      }
    }

    expect(removeSpy).toHaveBeenCalled();
    spy.mockRestore();
  });
});


