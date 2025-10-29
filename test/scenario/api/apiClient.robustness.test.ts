/**
 * Tests covering robustness of the low-level `ApiClient` implementation.
 *
 * These tests verify behavior on malformed responses and network errors and
 * ensure the retry/backoff helper is engaged correctly.
 */
import { ApiClient } from '../../api/client';
import { API_BASE_URL } from '../../config';
import { utils } from '../../utils/helper';

describe('api: ApiClient robustness', () => {
  afterEach(() => {
    if ((global as any).fetch && (global as any).fetch.mockRestore) (global as any).fetch.mockRestore();
  });

  it('rejects when server returns non-JSON body', async () => {
    // mock fetch that returns a response whose json() throws
    // avoid long retry/backoff by delegating retry helper to single attempt
    const retrySpy = jest.spyOn(utils, 'retryWithExponentialBackoff').mockImplementation(async (op: any) => op());
    const spy = utils.mockFetchSequence([
      () => Promise.resolve({ ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token'); } }),
    ]);

    const client = new ApiClient(API_BASE_URL);
    await expect(client.post('/non-json', { a: 1 })).rejects.toBeDefined();
    retrySpy.mockRestore();
    spy.mockRestore();
  });

  it('retries on network error (no status) and succeeds eventually', async () => {
    const responses: any[] = [
      () => Promise.reject(new Error('network')),
      () => Promise.reject(new Error('network')),
      () => Promise.resolve({ ok: true, status: 200, json: async () => ({ success: true }) }),
    ];

    const spy = utils.mockFetchSequence(responses.map(r => r));

    const client = new ApiClient(API_BASE_URL);
    const res = await client.post('/network-retry', { a: 1 });

    expect((global as any).fetch).toHaveBeenCalled();
    expect(res).toEqual({ success: true });
    spy.mockRestore();
  });
});


