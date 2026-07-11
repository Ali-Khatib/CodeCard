import { describe, it, expect } from 'vitest';
import {
  userNeedsEmailVerification,
  isVerificationCooldownActive,
  EMAIL_VERIFICATION_GENERIC_SUCCESS,
  EMAIL_VERIFICATION_GENERIC_ERROR,
} from '@/lib/auth/email-verification';

describe('userNeedsEmailVerification', () => {
  it('returns false for verified email-password users', () => {
    expect(
      userNeedsEmailVerification({
        email: 'user@example.com',
        email_confirmed_at: '2026-01-01T00:00:00Z',
        identities: [{ provider: 'email' }],
        app_metadata: { provider: 'email' },
      }),
    ).toBe(false);
  });

  it('returns true for unverified email-password users', () => {
    expect(
      userNeedsEmailVerification({
        email: 'user@example.com',
        email_confirmed_at: null,
        identities: [{ provider: 'email' }],
        app_metadata: { provider: 'email' },
      }),
    ).toBe(true);
  });

  it('returns false for OAuth users without an email identity', () => {
    expect(
      userNeedsEmailVerification({
        email: 'user@example.com',
        email_confirmed_at: null,
        identities: [{ provider: 'google' }],
        app_metadata: { provider: 'google' },
      }),
    ).toBe(false);
  });

  it('returns false when email is missing', () => {
    expect(
      userNeedsEmailVerification({
        email: null,
        email_confirmed_at: null,
        identities: [{ provider: 'email' }],
      }),
    ).toBe(false);
  });
});

describe('verification resend helpers', () => {
  it('uses generic success copy', () => {
    expect(EMAIL_VERIFICATION_GENERIC_SUCCESS).toContain('If your account');
  });

  it('uses generic error copy without leaking details', () => {
    expect(EMAIL_VERIFICATION_GENERIC_ERROR).not.toMatch(/@|token|supabase/i);
  });

  it('enforces cooldown windows', () => {
    const now = 2_000_000;
    expect(isVerificationCooldownActive(now - 10_000, now)).toBe(true);
    expect(isVerificationCooldownActive(now - 70_000, now)).toBe(false);
  });
});
