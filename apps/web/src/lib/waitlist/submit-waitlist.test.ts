import { describe, expect, it } from 'vitest';
import {
  WAITLIST_STORAGE_KEY,
  normalizeWaitlistEmail,
  submitWaitlistEmail,
  validateWaitlistEmail,
  waitlistValidationMessage,
} from './submit-waitlist';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    data,
  };
}

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

  it('normalizes emails before storing', () => {
    expect(normalizeWaitlistEmail('  You@CodeCard.DEV ')).toBe('you@codecard.dev');
  });

  it('stores first join and blocks duplicates', async () => {
    const storage = memoryStorage();
    const first = await submitWaitlistEmail('You@CodeCard.dev', storage);
    expect(first).toEqual({ ok: true, status: 'joined' });
    const stored = JSON.parse(storage.data[WAITLIST_STORAGE_KEY] ?? '[]') as string[];
    expect(stored).toEqual(['you@codecard.dev']);

    const second = await submitWaitlistEmail('you@codecard.dev', storage);
    expect(second).toEqual({ ok: true, status: 'already' });
    expect(JSON.parse(storage.data[WAITLIST_STORAGE_KEY] ?? '[]')).toHaveLength(1);
  });

  it('returns validation errors without writing storage', async () => {
    const storage = memoryStorage();
    const result = await submitWaitlistEmail('bad', storage);
    expect(result).toEqual({ ok: false, error: 'invalid' });
    expect(storage.data[WAITLIST_STORAGE_KEY]).toBeUndefined();
  });
});
