import { describe, expect, it } from 'vitest';
import { mapAuthFormError } from '@/lib/auth/map-auth-form-error';

describe('mapAuthFormError', () => {
  it('maps invalid credentials safely', () => {
    expect(mapAuthFormError('Invalid login credentials', 'sign-in')).toMatch(/don’t match/i);
  });

  it('maps already-registered accounts', () => {
    expect(mapAuthFormError('User already registered', 'sign-up')).toMatch(/already exists/i);
  });

  it('hides vendor internals', () => {
    const result = mapAuthFormError('JWT expired supabase stack sql Postgres', 'sign-in');
    expect(result).not.toMatch(/jwt|supabase|sql|postgres|stack/i);
    expect(result).toMatch(/try again/i);
  });

  it('keeps concise validation copy', () => {
    expect(mapAuthFormError('Invalid email', 'sign-in')).toBe('Invalid email');
  });
});
