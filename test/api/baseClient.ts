import type { IApiClient } from '../interfaces/IApiClient';

/**
 * Abstract base class providing safe request helpers for derived API clients.
 *
 * The helpers wrap low-level `ApiClient` calls and implement common error
 * handling patterns (ignore specific status codes, bubble others).
 */
export abstract class BaseApiClient {
  /** Low-level HTTP requester used to perform actual requests. */
  protected requests: IApiClient;
  /** Candidate identifier attached to payloads by derived clients. */
  protected candidateId: string;

  /**
   * Create a BaseApiClient.
   * @param requests - The low-level ApiClient instance.
   * @param candidateId - Candidate id appended to payloads.
   */
  constructor(requests: IApiClient, candidateId: string) {
    this.requests = requests;
    this.candidateId = candidateId;
  }

  /**
   * Perform a POST while ignoring configured HTTP statuses.
   *
   * Derived clients use this helper to treat certain response codes (e.g.
   * 400/409) as non-fatal for idempotent operations.
   *
   * @param path - Request path.
   * @param body - Request body payload.
   * @param ignoreStatuses - Status codes to swallow and return `undefined` for.
   * @returns Parsed response or `undefined` when an ignored status was returned.
   */
  protected async safePost(path: string, body: unknown, ignoreStatuses: number[] = [400, 409]) {
    try {
      return await this.requests.post(path, body);
    } catch (err: any) {
      const status = err?.response?.statusCode || err?.statusCode;
      if (ignoreStatuses.includes(status)) return;
      throw err;
    }
  }

  /**
   * Perform a GET and propagate any errors.
   * @param path - Request path to GET.
   * @returns Parsed response.
   */
  protected async safeGet(path: string) {
    return await this.requests.get(path);
  }

  /**
   * Perform a DELETE while optionally ignoring configured statuses.
   * @param path - Request path.
   * @param body - Optional payload for the DELETE request.
   * @param ignoreStatuses - Status codes to swallow and return `undefined` for.
   */
  protected async safeDelete(path: string, body: unknown, ignoreStatuses: number[] = [404]) {
    try {
      return await this.requests.del(path, body);
    } catch (err: any) {
      const status = err?.response?.statusCode || err?.statusCode;
      if (ignoreStatuses.includes(status)) return;
      throw err;
    }
  }
}


