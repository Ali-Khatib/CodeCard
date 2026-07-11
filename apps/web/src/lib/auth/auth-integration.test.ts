import { describe, it, expect } from 'vitest';
import { resolveOAuthCallback, oauthErrorMessage } from '@/lib/auth/oauth-callback';
import { sanitizeInternalRedirect, authCallbackRedirectUrl } from '@/lib/auth/redirect';
import { buildSignInHref, signInStatusMessage, SESSION_EXPIRED_MESSAGE } from '@/lib/auth/session-expiry';
import { userNeedsEmailVerification } from '@/lib/auth/email-verification';
import { isAuthSubmissionBlocked } from '@/lib/auth/auth-loading';
import { PASSWORD_RESET_GENERIC_SUCCESS } from '@/lib/auth/redirect';

/**
 * Contract tests for auth flows — complements Playwright smoke tests in e2e/auth.spec.ts.
 * Does not perform live Supabase authentication.
 */
describe('auth integration contracts', () => {
  it('rejects unsafe redirects across sign-in and callback helpers', () => {
    expect(sanitizeInternalRedirect('https://evil.example')).toBe('/dashboard');
    expect(buildSignInHref('//evil.example', 'session_expired')).toBe(
      '/sign-in?reason=session_expired',
    );

    const params = new URLSearchParams('code=test-code&redirect=https%3A%2F%2Fevil.example');
    const result = resolveOAuthCallback(params, { authConfigured: true });
    expect(result.kind === 'success' ? result.redirectPath : result.redirectPath).toBe('/dashboard');
  });

  it('maps OAuth failures to safe user messages without provider details', () => {
    const denied = resolveOAuthCallback(new URLSearchParams('error=access_denied'), {
      authConfigured: true,
    });
    expect(denied).toEqual({
      kind: 'error',
      reason: 'provider_denied',
      redirectPath: '/dashboard',
    });
    const message = oauthErrorMessage('provider_denied');
    expect(message).toContain("couldn't complete sign-in");
    expect(message).not.toMatch(/access_denied|supabase|token/i);
  });

  it('documents password-recovery generic success copy', () => {
    expect(PASSWORD_RESET_GENERIC_SUCCESS).toContain('If an account exists');
    expect(PASSWORD_RESET_GENERIC_SUCCESS).not.toMatch(/@|token|code/i);
  });

  it('blocks duplicate auth submissions while loading', () => {
    expect(isAuthSubmissionBlocked({ emailPending: true, oauthPending: null })).toBe(true);
    expect(isAuthSubmissionBlocked({ emailPending: false, oauthPending: 'github' })).toBe(true);
    expect(isAuthSubmissionBlocked({ emailPending: false, oauthPending: null })).toBe(false);
  });

  it('detects email verification requirement without OAuth false positives', () => {
    expect(
      userNeedsEmailVerification({
        email: 'user@example.com',
        email_confirmed_at: null,
        identities: [{ provider: 'email' }],
      }),
    ).toBe(true);
    expect(
      userNeedsEmailVerification({
        email: 'user@example.com',
        email_confirmed_at: null,
        identities: [{ provider: 'google' }],
      }),
    ).toBe(false);
  });

  it('builds callback URLs without leaking tokens', () => {
    const original = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.codecard.test';
    const url = authCallbackRedirectUrl('/dashboard');
    expect(url).not.toMatch(/access_token|refresh_token|code=/);
    process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it('preserves safe internal return paths after reauthentication', () => {
    expect(signInStatusMessage('session_expired')).toBe(SESSION_EXPIRED_MESSAGE);
    expect(buildSignInHref('/dashboard/analytics', 'session_expired')).toContain(
      'redirect=%2Fdashboard%2Fanalytics',
    );
  });
});
