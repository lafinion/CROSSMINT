/**
 * Tests for BaseApiClient's idempotency helpers (`safePost`, `safeDelete`).
 * Verifies that certain HTTP statuses are swallowed as intended.
 */
import { BaseApiClient } from '../../api/baseClient';

class TestClient extends BaseApiClient {
  public async callSafePost(path: string, body: unknown) {
    return await this.safePost(path, body);
  }

  public async callSafeDelete(path: string, body: unknown) {
    return await this.safeDelete(path, body);
  }
}

describe('api: BaseApiClient idempotency handling', () => {
  it('treats 409 and 400 as success for safePost', async () => {
    const mockRequests: any = { post: jest.fn().mockRejectedValue({ response: { statusCode: 409 } }) };
    const client = new TestClient(mockRequests, 'candidate-x');
    await expect(client.callSafePost('/api/test', { a: 1 })).resolves.toBeUndefined();
    expect(mockRequests.post).toHaveBeenCalled();
  });

  it('throws for non-ignored statuses on safePost', async () => {
    const mockRequests: any = { post: jest.fn().mockRejectedValue({ response: { statusCode: 500 } }) };
    const client = new TestClient(mockRequests, 'candidate-x');
    await expect(client.callSafePost('/api/test', { a: 1 })).rejects.toBeDefined();
  });

  it('treats 404 as success for safeDelete', async () => {
    const mockRequests: any = { del: jest.fn().mockRejectedValue({ response: { statusCode: 404 } }) };
    const client = new TestClient(mockRequests, 'candidate-x');
    await expect(client.callSafeDelete('/api/test', { r: 1 })).resolves.toBeUndefined();
    expect(mockRequests.del).toHaveBeenCalled();
  });
});


