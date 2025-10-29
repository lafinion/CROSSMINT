import { PolyanetModel, SoloonModel, ComethModel } from '../interfaces/models';
import { BaseApiClient } from './baseClient';
import type { ICrossmintClient } from '../interfaces/ICrossmintClient';
import type { IApiClient } from '../interfaces/IApiClient';

/**
 * Client wrapper providing higher-level API operations used by tests.
 *
 * Extends `BaseApiClient` to add domain-specific helpers (create/remove
 * entities, fetch the goal map, validate the solution) while reusing the
 * safe request helpers implemented on the base class.
 */
export class CrossmintClient extends BaseApiClient implements ICrossmintClient {
  /**
   * Construct a CrossmintClient bound to a requests implementation and
   * candidate id.
   *
   * @param requests - Low-level HTTP requester (ApiClient) used to perform requests.
   * @param candidateId - Candidate identifier appended to entity payloads.
   */
  constructor(requests: IApiClient, candidateId: string) {
    super(requests, candidateId);
  }

  /**
   * Create a polyanet at the given coordinates.
   * @param polyanet - Polyanet model describing the position and attributes.
   * @returns The created resource or undefined when ignored status is returned.
   */
  public async createPolyanetAt(polyanet: PolyanetModel) {
    return await this.safePost('/api/polyanets', { ...polyanet, candidateId: this.candidateId });
  }

  /**
   * Remove a polyanet at the given coordinates.
   * @param polyanet - Polyanet model describing the position to remove.
   */
  public async removePolyanetAt(polyanet: PolyanetModel) {
    return await this.safeDelete('/api/polyanets', { ...polyanet, candidateId: this.candidateId });
  }

  /**
   * Create a soloon at the given coordinates.
   * @param soloon - Soloon model describing the position and attributes.
   * @returns The created resource or undefined when ignored status is returned.
   */
  public async createSoloonAt(soloon: SoloonModel) {
    return await this.safePost('/api/soloons', { ...soloon, candidateId: this.candidateId });
  }

  /**
   * Remove a soloon at the given coordinates.
   * @param soloon - Soloon model describing the position to remove.
   */
  public async removeSoloonAt(soloon: SoloonModel) {
    return await this.safeDelete('/api/soloons', { ...soloon, candidateId: this.candidateId });
  }

  /**
   * Create a cometh at the given coordinates.
   * @param cometh - Cometh model describing the position and attributes.
   * @returns The created resource or undefined when ignored status is returned.
   */
  public async createComethAt(cometh: ComethModel) {
    return await this.safePost('/api/comeths', { ...cometh, candidateId: this.candidateId });
  }

  /**
   * Remove a cometh at the given coordinates.
   * @param cometh - Cometh model describing the position to remove.
   */
  public async removeComethAt(cometh: ComethModel) {
    return await this.safeDelete('/api/comeths', { ...cometh, candidateId: this.candidateId });
  }

  /**
   * Fetch the goal map for the configured candidate.
   * @returns The goal map object or raw response if `goal` property is absent.
   */
  public async fetchGoalMap() {
    const res = await this.safeGet(`/api/map/${this.candidateId}/goal`);
    return res?.goal ?? res;
  }

  /**
   * Trigger solution validation for the configured candidate.
   * @returns Validation result or undefined when ignored statuses occur.
   */
  public async validateSolution() {
    return await this.safePost(`/api/map/${this.candidateId}/validate`, { candidateId: this.candidateId }, []);
  }
}

// default instance is created in `test/api/instances.ts` to avoid importing
// the concrete ApiClient at module evaluation time (helps testing).
