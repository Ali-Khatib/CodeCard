import { describe, expect, it } from 'vitest';
import {
  isReservedProfileSlug,
  RESERVED_PROFILE_SLUGS,
} from './reserved-profile-slugs';

describe('reserved profile slugs', () => {
  it('includes core application routes', () => {
    for (const slug of [
      'dashboard',
      'sign-in',
      'sign-up',
      'pricing',
      'landing',
      'auth',
      'api',
      'reset-password',
      'forgot-password',
    ]) {
      expect(RESERVED_PROFILE_SLUGS.has(slug)).toBe(true);
      expect(isReservedProfileSlug(slug)).toBe(true);
    }
  });

  it('is case-insensitive', () => {
    expect(isReservedProfileSlug('Dashboard')).toBe(true);
  });

  it('allows normal profile slugs', () => {
    expect(isReservedProfileSlug('alex-chen')).toBe(false);
  });
});
