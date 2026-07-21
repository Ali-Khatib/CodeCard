import { sanitizeInternalRedirect } from '@/lib/auth/redirect';

export const OAUTH_ERROR_REASONS = [
  'provider_denied',
  'missing_code',
  'exchange_failed',
  'link_expired',
  'misconfigured',
  'malformed_state',
] as const;

export type OAuthErrorReason = (typeof OAUTH_ERROR_REASONS)[number];

export const OAUTH_USER_MESSAGE =
  "We couldn't complete sign-in. Please try again.";

export const OAUTH_LINK_EXPIRED_MESSAGE =
  'This confirmation or sign-in link is invalid or has expired. Request a new email, or sign in if you already confirmed.';

export const OAUTH_MISCONFIGURED_MESSAGE =
  'Sign-in is temporarily unavailable. Please try again later.';

export type OAuthCallbackSuccess = {
  kind: 'success';
  code: string;
  redirectPath: string;
};

export type OAuthCallbackFailure = {
  kind: 'error';
  reason: OAuthErrorReason;
  redirectPath: string;
};

export type OAuthCallbackResolution = OAuthCallbackSuccess | OAuthCallbackFailure;

export function resolveOAuthCallback(
  searchParams: URLSearchParams,
  options: { authConfigured: boolean },
): OAuthCallbackResolution {
  const redirectPath = sanitizeInternalRedirect(searchParams.get('redirect'));

  if (!options.authConfigured) {
    return { kind: 'error', reason: 'misconfigured', redirectPath };
  }

  const providerError = searchParams.get('error');
  if (providerError) {
    return { kind: 'error', reason: 'provider_denied', redirectPath };
  }

  const code = searchParams.get('code');
  if (!code || !code.trim()) {
    return { kind: 'error', reason: 'missing_code', redirectPath };
  }

  return { kind: 'success', code, redirectPath };
}

export function oauthErrorMessage(reason: OAuthErrorReason): string {
  if (reason === 'misconfigured') return OAUTH_MISCONFIGURED_MESSAGE;
  if (reason === 'link_expired') return OAUTH_LINK_EXPIRED_MESSAGE;
  return OAUTH_USER_MESSAGE;
}

/** Map code-exchange failures to accurate recovery copy without leaking vendor details. */
export function classifyCodeExchangeError(message: string | null | undefined): OAuthErrorReason {
  const lower = (message ?? '').toLowerCase();
  if (
    lower.includes('expired') ||
    lower.includes('otp_expired') ||
    lower.includes('invalid flow state') ||
    lower.includes('flow state') ||
    lower.includes('pkce') ||
    lower.includes('code verifier') ||
    lower.includes('auth code') ||
    lower.includes('invalid request')
  ) {
    return 'link_expired';
  }
  return 'exchange_failed';
}

export function buildAuthErrorUrl(
  origin: string,
  reason: OAuthErrorReason,
  redirectPath: string,
): string {
  const url = new URL('/auth/error', origin);
  url.searchParams.set('reason', reason);
  if (redirectPath !== '/dashboard') {
    url.searchParams.set('redirect', redirectPath);
  }
  return url.toString();
}

export function buildSignInRetryUrl(redirectPath: string): string {
  const safe = sanitizeInternalRedirect(redirectPath);
  const params = new URLSearchParams();
  if (safe !== '/dashboard') {
    params.set('redirect', safe);
  }
  const query = params.toString();
  return query ? `/sign-in?${query}` : '/sign-in';
}

export function logOAuthCallbackFailure(reason: OAuthErrorReason): void {
  console.warn('[auth/callback] oauth_failure', { category: reason });
}
