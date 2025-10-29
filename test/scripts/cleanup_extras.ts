/**
 * Script used by tests to remove extra polyanets that are not present in the
 * goal map. The script compares the current map on the server with the goal
 * and deletes any polyanet entities (type === 0) that should not exist.
 */
import { crossmintClient } from '../api/instances';
import { API_BASE_URL, CANDIDATE_ID } from '../config';
import { utils } from '../utils/helper';

/**
 * Fetch current goal and map from the test API, compute extras and remove them.
 */
async function main() {
  // Fetch goal definition. The endpoint may return either an object with a
  // `goal` property or the goal directly; normalize both shapes.
  const goalRes = await fetch(`${API_BASE_URL}/api/map/${CANDIDATE_ID}/goal`);
  const goalBody = await goalRes.json();
  const goal = goalBody.goal ?? goalBody;

  // Fetch the full map content. `mapBody.map?.content` is used to tolerate
  // different response shapes; default to an empty grid if missing.
  const mapRes = await fetch(`${API_BASE_URL}/api/map/${CANDIDATE_ID}`);
  const mapBody = await mapRes.json();
  const content = mapBody.map?.content ?? [];

  // Collect coordinates of polyanet entities which are not expected by goal.
  const toDelete: Array<{ row: number; column: number }> = [];
  for (let r = 0; r < content.length; r++) {
    // Use a defensive access pattern for potentially sparse rows.
    for (let c = 0; c < (content[r] || []).length; c++) {
      const cell = content[r][c];
      const wanted = goal?.[r]?.[c];

      // Complex logic: identify polyanet cells by `type === 0` and only
      // schedule removal when the goal at that position is not 'POLYANET'.
      // We explicitly check that `cell` is an object to guard against
      // primitive values in the grid.
      if (cell && typeof cell === 'object' && cell.type === 0) {
        if (wanted !== 'POLYANET') {
          toDelete.push({ row: r, column: c });
        }
      }
    }
  }

  utils.logInfo(`Found extras to delete: ${toDelete.length}`);

  // Iterate over collected coordinates and attempt deletion. Each delete is
  // attempted independently so a failure at one coordinate does not abort the
  // entire cleanup run.
  for (const { row, column } of toDelete) {
    try {
      await crossmintClient.removePolyanetAt({ row, column });
      utils.logInfo(`Deleted polyanet at ${row} ${column}`);
    } catch (e) {
      // Log errors; cleanup runs are best-effort and should record failures
      // without throwing to allow CI scripts to continue if desired.
      utils.logError(`Failed to delete at ${row} ${column} ${e}`);
    }
  }
}

// Allow direct execution from the command line.
if (require.main === module) main();


