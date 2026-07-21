import { describe, it, expect } from 'vitest';
import {
  buildAuthErrorUrl,
  buildSignInRetryUrl,
  classifyCodeExchangeError,
  oauthErrorMessage,
  OAUTH_LINK_EXPIRED_MESSAGE,
  resolveOAuthCallback,
} from '@/lib/auth/oauth-callback';

describe('resolveOAuthCallback', () => {
  it('accepts a valid authorization code', () => {
    const params = new URLSearchParams('code=safe-code&redirect=/dashboard?tab=projects');
    const result = resolveOAuthCallback(params, { authConfigured: true });
    expect(result).toEqual({
      kind: 'success',
      code: 'safe-code',
      redirectPath: '/dashboard?tab=projects',
    });
  });

  it('returns provider_denied when the provider reports an error', () => {
    const params = new URLSearchParams('error=access_denied&error_description=User%20denied');
    const result = resolveOAuthCallback(params, { authConfigured: true });
    expect(result).toEqual({
      kind: 'error',
      reason: 'provider_denied',
      redirectPath: '/dashboard',
    });
  });

  it('returns missing_code when no code is present', () => {
    const result = resolveOAuthCallback(new URLSearchParams(), { authConfigured: true });
    expect(result).toEqual({
      kind: 'error',
      reason: 'missing_code',
      redirectPath: '/dashboard',
    });
  });

  it('returns misconfigured when auth is unavailable', () => {
    const params = new URLSearchParams('code=safe-code');
    const result = resolveOAuthCallback(params, { authConfigured: false });
    expect(result).toEqual({
      kind: 'error',
      reason: 'misconfigured',
      redirectPath: '/dashboard',
    });
  });

  it('rejects unsafe redirect parameters', () => {
    const params = new URLSearchParams('code=safe-code&redirect=https%3A%2F%2Fevil.example');
    const result = resolveOAuthCallback(params, { authConfigured: true });
    expect(result.kind === 'success' || result.kind === 'error').toBe(true);
    if (result.kind === 'success') {
      expect(result.redirectPath).toBe('/dashboard');
    } else {
      expect(result.redirectPath).toBe('/dashboard');
    }
  });
});

describe('classifyCodeExchangeError', () => {
  it('maps expired or invalid PKCE codes to link_expired', () => {
    expect(classifyCodeExchangeError('otp_expired')).toBe('link_expired');
    expect(classifyCodeExchangeError('invalid flow state')).toBe('link_expired');
    expect(classifyCodeExchangeError('PKCE code verifier not found')).toBe('link_expired');
  });

  it('maps other exchange failures to exchange_failed', () => {
    expect(classifyCodeExchangeError('unexpected provider failure')).toBe('exchange_failed');
    expect(classifyCodeExchangeError(null)).toBe('exchange_failed');
  });
});

describe('oauth error UX helpers', () => {
  it('uses safe user-facing messages', () => {
    expect(oauthErrorMessage('exchange_failed')).toBe("We couldn't complete sign-in. Please try again.");
    expect(oauthErrorMessage('exchange_failed')).not.toMatch(/supabase|token|code|access_denied/i);
    expect(oauthErrorMessage('misconfigured')).toContain('temporarily unavailable');
    expect(oauthErrorMessage('link_expired')).toBe(OAUTH_LINK_EXPIRED_MESSAGE);
    expect(oauthErrorMessage('link_expired')).not.toMatch(/supabase|jwt|stack/i);
  });

  it('builds auth error URLs without leaking provider details', () => {
    const url = buildAuthErrorUrl('https://app.codecard.test', 'missing_code', '/dashboard/projects');
    expect(url).toBe(
      'https://app.codecard.test/auth/error?reason=missing_code&redirect=%2Fdashboard%2Fprojects',
    );
    expect(url).not.toMatch(/access_token|refresh_token|code=/);
  });

  it('builds retry URLs back to sign-in with safe redirects', () => {
    expect(buildSignInRetryUrl('/dashboard/analytics')).toBe(
      '/sign-in?redirect=%2Fdashboard%2Fanalytics',
    );
    expect(buildSignInRetryUrl('https://evil.example')).toBe('/sign-in');
  });
});
