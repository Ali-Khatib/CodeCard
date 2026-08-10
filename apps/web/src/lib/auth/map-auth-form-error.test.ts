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

  it('maps weak password copy to the full requirements', () => {
    expect(mapAuthFormError('Password must contain an uppercase letter', 'sign-up')).toMatch(
      /8 characters.*uppercase.*lowercase.*number/i,
    );
    expect(mapAuthFormError('String must contain at least 1 character(s)', 'sign-up')).toMatch(
      /8 characters/i,
    );
  });

  it('keeps concise validation copy', () => {
    expect(mapAuthFormError('Invalid email', 'sign-in')).toBe('Invalid email');
  });

  it('maps disabled GitHub provider clearly', () => {
    expect(mapAuthFormError('Unsupported provider: provider is not enabled', 'sign-up')).toMatch(
      /not enabled/i,
    );
  });
});
