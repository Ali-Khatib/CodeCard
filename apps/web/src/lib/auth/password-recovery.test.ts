import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  authCallbackRedirectUrl,
  sanitizeInternalRedirect,
  PASSWORD_RESET_GENERIC_SUCCESS,
} from '@/lib/auth/redirect';
import {
  isRecoveryCooldownActive,
  mapPasswordResetClientError,
  passwordResetRedirectUrl,
} from '@/lib/auth/password-recovery';
import { forgotPasswordSchema, resetPasswordSchema } from '@codecard/validation';

describe('sanitizeInternalRedirect', () => {
  it('allows safe internal paths', () => {
    expect(sanitizeInternalRedirect('/dashboard')).toBe('/dashboard');
    expect(sanitizeInternalRedirect('/reset-password')).toBe('/reset-password');
  });

  it('rejects external and protocol-relative URLs', () => {
    expect(sanitizeInternalRedirect('https://evil.test')).toBe('/dashboard');
    expect(sanitizeInternalRedirect('//evil.test')).toBe('/dashboard');
    expect(sanitizeInternalRedirect('/\\evil')).toBe('/dashboard');
    expect(sanitizeInternalRedirect(null)).toBe('/dashboard');
  });
});

describe('password recovery redirect URLs', () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.codecard.test';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it('builds same-origin callback URLs without leaking tokens', () => {
    const url = authCallbackRedirectUrl('/reset-password');
    expect(url).toBe(
      'https://app.codecard.test/auth/callback?redirect=%2Freset-password',
    );
    expect(url).not.toMatch(/access_token|refresh_token|code=/);
  });

  it('uses reset-password as the post-callback destination', () => {
    expect(passwordResetRedirectUrl()).toContain('redirect=%2Freset-password');
  });
});

describe('forgotPasswordSchema', () => {
  it('rejects invalid email locally', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });

  it('accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true);
  });
});

describe('resetPasswordSchema', () => {
  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'SecurePass1',
      confirmPassword: 'SecurePass2',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe('Passwords do not match');
    }
  });

  it('accepts matching strong passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'SecurePass1',
      confirmPassword: 'SecurePass1',
    });
    expect(result.success).toBe(true);
  });
});

describe('recovery UX helpers', () => {
  it('uses generic success copy', () => {
    expect(PASSWORD_RESET_GENERIC_SUCCESS).toContain('If an account exists');
  });

  it('maps client errors to generic messages', () => {
    expect(mapPasswordResetClientError()).not.toMatch(/supabase|token|email/i);
  });

  it('enforces cooldown windows', () => {
    const now = 1_000_000;
    expect(isRecoveryCooldownActive(now - 10_000, now)).toBe(true);
    expect(isRecoveryCooldownActive(now - 70_000, now)).toBe(false);
    expect(isRecoveryCooldownActive(null, now)).toBe(false);
  });
});
