/** Lightweight HTTP client interface used by CrossmintClient */
export interface IApiClient {
  post(path: string, payload: unknown): Promise<any>;
  get(path: string): Promise<any>;
  del(path: string, payload?: unknown): Promise<any>;
}


