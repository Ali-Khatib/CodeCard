import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildSignInHref,
  hasSupabaseAuthCookie,
  isAuthSessionMissingError,
  isUnauthorizedResponse,
  resetSessionExpiryRedirectLock,
  SESSION_EXPIRED_MESSAGE,
  shouldTreatAsSessionExpiry,
  signInStatusMessage,
} from '@/lib/auth/session-expiry';

describe('buildSignInHref', () => {
  it('preserves safe internal return paths', () => {
    expect(buildSignInHref('/dashboard/projects', 'session_expired')).toBe(
      '/sign-in?redirect=%2Fdashboard%2Fprojects&reason=session_expired',
    );
  });

  it('rejects external return paths', () => {
    expect(buildSignInHref('https://evil.example', 'session_expired')).toBe(
      '/sign-in?reason=session_expired',
    );
  });
});

describe('hasSupabaseAuthCookie', () => {
  it('detects stale Supabase auth cookies', () => {
    expect(
      hasSupabaseAuthCookie([{ name: 'sb-test-auth-token', value: 'x' }]),
    ).toBe(true);
    expect(hasSupabaseAuthCookie([{ name: 'other', value: 'x' }])).toBe(false);
  });
});

describe('session expiry detection', () => {
  beforeEach(() => {
    resetSessionExpiryRedirectLock();
  });

  it('maps session_expired and account_deleted reasons to safe messages', () => {
    expect(signInStatusMessage('session_expired')).toBe(SESSION_EXPIRED_MESSAGE);
    expect(signInStatusMessage('account_deleted')).toMatch(/account has been deleted/i);
    expect(signInStatusMessage('oauth_error')).toBeNull();
  });

  it('recognizes auth session missing errors', () => {
    expect(isAuthSessionMissingError({ message: 'Auth session missing!' })).toBe(true);
    expect(isAuthSessionMissingError({ message: 'Invalid email format' })).toBe(false);
  });

  it('treats only 401 responses as session expiry', () => {
    expect(isUnauthorizedResponse(new Response(null, { status: 401 }))).toBe(true);
    expect(shouldTreatAsSessionExpiry(new Response(null, { status: 500 }))).toBe(false);
    expect(shouldTreatAsSessionExpiry(new Response(null, { status: 400 }))).toBe(false);
  });
});
