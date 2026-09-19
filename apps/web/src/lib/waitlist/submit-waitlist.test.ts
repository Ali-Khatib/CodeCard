import { describe, expect, it, vi } from 'vitest';
import {
  normalizeWaitlistEmail,
  submitWaitlistEmail,
  validateWaitlistEmail,
  waitlistValidationMessage,
} from './submit-waitlist';

describe('waitlist email submit', () => {
  it('rejects empty and malformed emails', () => {
    expect(validateWaitlistEmail('')).toBe('required');
    expect(validateWaitlistEmail('   ')).toBe('required');
    expect(validateWaitlistEmail('not-an-email')).toBe('invalid');
    expect(validateWaitlistEmail('a@b')).toBe('invalid');
    expect(validateWaitlistEmail('you@codecard.dev')).toBeNull();
    expect(waitlistValidationMessage('required')).toMatch(/email/i);
    expect(waitlistValidationMessage('invalid')).toMatch(/valid/i);
  });

  it('normalizes emails before sending', () => {
    expect(normalizeWaitlistEmail('  You@CodeCard.DEV ')).toBe('you@codecard.dev');
  });

  it('posts to the waitlist API and maps joined vs already', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, status: 'joined' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = await submitWaitlistEmail('You@CodeCard.dev');
    expect(first).toEqual({ ok: true, status: 'joined' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/waitlist',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'you@codecard.dev', website: '' }),
      }),
    );

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, status: 'already' }),
    });
    const second = await submitWaitlistEmail('you@codecard.dev');
    expect(second).toEqual({ ok: true, status: 'already' });

    vi.unstubAllGlobals();
  });

  it('returns validation errors without calling the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const result = await submitWaitlistEmail('bad');
    expect(result).toEqual({ ok: false, error: 'invalid' });
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
