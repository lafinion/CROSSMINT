/**
 * Unit tests for the high-level `CrossmintClient` which composes the
 * low-level `ApiClient` and appends candidate identifiers to requests.
 */
import { CrossmintClient } from '../../api/crossmintClient';

describe('api: CrossmintClient', () => {
  const mockApi = {
    post: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  } as any;

  const client = new CrossmintClient(mockApi, 'scenario-candidate');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls post for createPolyanetAt with candidateId', async () => {
    mockApi.post.mockResolvedValue({});
    await client.createPolyanetAt({ row: 1, column: 2 });
    expect(mockApi.post).toHaveBeenCalledWith('/api/polyanets', { row: 1, column: 2, candidateId: 'scenario-candidate' });
  });

  it('treats 409 as success for create', async () => {
    mockApi.post.mockRejectedValue({ response: { statusCode: 409 } });
    await expect(client.createPolyanetAt({ row: 1, column: 2 })).resolves.toBeUndefined();
    expect(mockApi.post).toHaveBeenCalled();
  });

  it('calls delete for removePolyanetAt and ignores 404', async () => {
    mockApi.del.mockRejectedValue({ response: { statusCode: 404 } });
    await expect(client.removePolyanetAt({ row: 1, column: 2 })).resolves.toBeUndefined();
    expect(mockApi.del).toHaveBeenCalledWith('/api/polyanets', { row: 1, column: 2, candidateId: 'scenario-candidate' });
  });
});


