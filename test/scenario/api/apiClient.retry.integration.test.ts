/**
 * Integration-style tests for ApiClient retry/backoff behavior. These tests
 * simulate sequential HTTP responses (429, 500, then 200) to validate the
 * retry loop performs eventual success.
 */
import { ApiClient } from '../../api/client';
import { API_BASE_URL } from '../../config';
import { utils } from '../../utils/helper';

jest.setTimeout(20000);

describe('api: ApiClient retry/backoff integration', () => {
  beforeEach(() => {});

  afterEach(() => {
    if ((global as any).fetch && (global as any).fetch.mockRestore) (global as any).fetch.mockRestore();
  });

  it('retries on 429/5xx and succeeds eventually', async () => {
    const responses: Array<any> = [
      { ok: false, status: 429, text: async () => 'Too Many Requests' },
      { ok: false, status: 500, text: async () => 'Server Error' },
      { ok: true, status: 200, text: async () => JSON.stringify({ success: true }) },
    ];

    const spy = utils.mockFetchSequence(responses.map(r => () => Promise.resolve({
      ok: r.ok,
      status: r.status,
      text: r.text,
      json: async () => {
        const t = await r.text();
        try {
          return JSON.parse(t);
        } catch {
          return t;
        }
      },
    })));

    const client = new ApiClient(API_BASE_URL);
    const result = await client.post('/test-retry', { a: 1 });

    // final attempt should have been made and succeeded
    expect((global as any).fetch).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ success: true });
    spy.mockRestore();
  });
});


