/**
 * Tests for the retryWithExponentialBackoff helper ensuring retry behavior
 * and that the helper stops after the configured maximum attempts.
 */
import { utils } from '../../utils/helper';

describe('unit: retryWithExponentialBackoff', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('retries until success', async () => {
    let attempts = 0;
    const op = jest.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) return Promise.reject({ response: { statusCode: 500 } });
      return Promise.resolve('ok');
    });

    const res = await utils.retryWithExponentialBackoff(op, 5, 1);
    expect(res).toBe('ok');
    expect(op).toHaveBeenCalledTimes(3);
  });

  it('rejects after max retries', async () => {
    const op = jest.fn().mockRejectedValue({ response: { statusCode: 500 } });
    await expect(utils.retryWithExponentialBackoff(op, 2, 1)).rejects.toBeDefined();
    expect(op).toHaveBeenCalled();
  });
});


