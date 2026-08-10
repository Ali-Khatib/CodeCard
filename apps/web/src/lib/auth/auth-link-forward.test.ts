import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import {
  buildAuthCallbackForwardUrl,
  defaultPostAuthRedirectForType,
  hasSupabaseAuthExchangeParams,
  shouldForwardAuthExchangeToCallback,
} from '@/lib/auth/auth-link-forward';

describe('auth-link-forward', () => {
  it('detects code and token_hash exchange params', () => {
    expect(hasSupabaseAuthExchangeParams(new URLSearchParams('code=abc'))).toBe(true);
    expect(
      hasSupabaseAuthExchangeParams(new URLSearchParams('token_hash=h&type=recovery')),
    ).toBe(true);
    expect(hasSupabaseAuthExchangeParams(new URLSearchParams())).toBe(false);
  });

  it('forwards landing-page codes to callback with reset-password redirect', () => {
    const request = new NextRequest('https://codecard-mvp.vercel.app/?code=abc123');
    expect(shouldForwardAuthExchangeToCallback('/', request.nextUrl.searchParams)).toBe(true);

    const forward = buildAuthCallbackForwardUrl(request);
    expect(forward.pathname).toBe('/auth/callback');
    expect(forward.searchParams.get('code')).toBe('abc123');
    expect(forward.searchParams.get('redirect')).toBe('/reset-password');
  });

  it('preserves an explicit redirect when forwarding', () => {
    const request = new NextRequest(
      'https://codecard-mvp.vercel.app/?code=abc123&redirect=%2Fauth%2Fconfirmed',
    );
    const forward = buildAuthCallbackForwardUrl(request);
    expect(forward.searchParams.get('redirect')).toBe('/auth/confirmed');
  });

  it('does not forward when already on the callback route', () => {
    expect(
      shouldForwardAuthExchangeToCallback(
        '/auth/callback',
        new URLSearchParams('code=abc'),
      ),
    ).toBe(false);
  });

  it('maps otp types to post-auth destinations', () => {
    expect(defaultPostAuthRedirectForType('recovery')).toBe('/reset-password');
    expect(defaultPostAuthRedirectForType('signup')).toBe('/auth/confirmed');
    expect(defaultPostAuthRedirectForType(null)).toBe('/dashboard');
  });
});
