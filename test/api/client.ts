/**
 * Low-level HTTP client used by the tests.
 *
 * Provides a small wrapper over fetch with automatic base URL handling
 * and built-in retry logic via `utils.retryWithExponentialBackoff`.
 */
import { API_BASE_URL } from '../config';
import { utils } from '../utils/helper';
import type { IApiClient } from '../interfaces/IApiClient';

/**
 * Build a full URL by concatenating a base and a path while ensuring there
 * is no duplicate trailing slash.
 *
 * @param base - Base URL, e.g. `https://example.com/api`.
 * @param path - Path starting with `/` to append to the base.
 * @returns The combined URL string.
 */
function urlFor(base: string, path: string) {
  return `${base.replace(/\/$/, '')}${path}`;
}

export class ApiClient implements IApiClient {
  private baseUrl: string;

  /**
   * Create an ApiClient.
   * @param baseUrl - The base URL for requests; trailing slash will be removed.
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Internal request helper which performs the HTTP request and parses JSON.
   * Retries are performed by the helper from `utils`.
   *
   * @private
   * @param method - HTTP method to use (GET, POST, DELETE, etc.).
   * @param path - Request path to append to the base URL.
   * @param payload - Optional payload to JSON-encode as the request body.
   * @returns Parsed JSON response.
   * @throws Error with `response` details when non-2xx status is returned.
   */
  private async request(method: string, path: string, payload?: unknown) {
    const url = urlFor(this.baseUrl, path);
    return await utils.retryWithExponentialBackoff(async () => {
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: payload !== undefined ? JSON.stringify(payload) : undefined,
      });
      if (!res.ok) {
        const body = await res.text();
        const err: any = new Error(`HTTP ${res.status}`);
        err.response = { statusCode: res.status, body };
        throw err;
      }
      return await res.json();
    });
  }

  /**
   * Perform a POST request.
   * @param path - Request path.
   * @param payload - Body payload to send.
   */
  public async post(path: string, payload: unknown) {
    return await this.request('POST', path, payload);
  }

  /**
   * Perform a GET request.
   * @param path - Request path.
   */
  public async get(path: string) {
    return await this.request('GET', path);
  }

  /**
   * Perform a DELETE request.
   * @param path - Request path.
   * @param payload - Optional body payload for the request.
   */
  public async del(path: string, payload?: unknown) {
    return await this.request('DELETE', path, payload);
  }
}

/**
 * Default ApiClient instance configured with the test `API_BASE_URL`.
 */
/** Default ApiClient instance configured with the test `API_BASE_URL`. */
export const apiClient: IApiClient = new ApiClient(API_BASE_URL);


