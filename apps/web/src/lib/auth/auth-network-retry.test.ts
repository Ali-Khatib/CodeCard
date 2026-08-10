import { describe, expect, it, vi } from 'vitest';
import {
  isRetryableAuthNetworkError,
  withAuthNetworkRetry,
} from './auth-network-retry';

describe('auth network retry', () => {
  it('retries AuthRetryableFetchError then succeeds', async () => {
    const op = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('Failed to fetch'), { name: 'AuthRetryableFetchError' }))
      .mockResolvedValueOnce({ ok: true });

    await expect(withAuthNetworkRetry(op, { attempts: 3, delayMs: 1 })).resolves.toEqual({ ok: true });
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('does not retry credential errors', async () => {
    const op = vi.fn().mockRejectedValue(Object.assign(new Error('Invalid login credentials'), { name: 'AuthApiError' }));
    await expect(withAuthNetworkRetry(op, { attempts: 3, delayMs: 1 })).rejects.toThrow(/Invalid login/);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('detects retryable network shapes', () => {
    expect(
      isRetryableAuthNetworkError(Object.assign(new Error('Failed to fetch'), { name: 'AuthRetryableFetchError' })),
    ).toBe(true);
    expect(isRetryableAuthNetworkError(new TypeError('Load failed'))).toBe(true);
    expect(isRetryableAuthNetworkError(new Error('Invalid login credentials'))).toBe(false);
  });
});
