/**
 * Test API instances module.
 *
 * Provides preconfigured client instances used by the test-suite. Keeping
 * instance creation in this module avoids importing the concrete ApiClient
 * at module evaluation time in other modules which can simplify test setup.
 */
import { apiClient } from './client';
import { CrossmintClient } from './crossmintClient';
import type { ICrossmintClient } from '../interfaces/ICrossmintClient';
import { CANDIDATE_ID } from '../config';

/**
 * Default Crossmint client instance for tests.
 * @type {ICrossmintClient}
 */
export const crossmintClient: ICrossmintClient = new CrossmintClient(apiClient, CANDIDATE_ID);


