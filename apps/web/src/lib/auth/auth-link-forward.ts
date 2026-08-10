import type { NextRequest } from 'next/server';

/**
 * Supabase recovery / confirm emails sometimes land on Site URL (`/`) with
 * `?code=` or `?token_hash=` when `redirectTo` is rejected or omitted.
 * Forward those params to `/auth/callback` so we can establish a session and
 * send the user to the right page (reset password, confirmed, etc.).
 */
export function hasSupabaseAuthExchangeParams(searchParams: URLSearchParams): boolean {
  const code = searchParams.get('code')?.trim();
  const tokenHash = searchParams.get('token_hash')?.trim();
  return Boolean(code || tokenHash);
}

export function defaultPostAuthRedirectForType(type: string | null): string {
  if (type === 'recovery') return '/reset-password';
  if (type === 'signup' || type === 'email' || type === 'invite') return '/auth/confirmed';
  return '/dashboard';
}

/**
 * When auth params hit a non-callback path (often the marketing landing),
 * build a redirect to `/auth/callback` preserving exchange params.
 */
export function buildAuthCallbackForwardUrl(request: NextRequest): URL {
  const url = request.nextUrl.clone();
  const { pathname, searchParams } = request.nextUrl;
  const type = searchParams.get('type');

  url.pathname = '/auth/callback';

  if (!searchParams.get('redirect')) {
    if (type === 'recovery' || (!type && (pathname === '/' || pathname === '/landing'))) {
      url.searchParams.set('redirect', '/reset-password');
    } else {
      url.searchParams.set('redirect', defaultPostAuthRedirectForType(type));
    }
  }

  return url;
}

export function shouldForwardAuthExchangeToCallback(
  pathname: string,
  searchParams: URLSearchParams,
): boolean {
  if (pathname.startsWith('/auth/callback')) return false;
  return hasSupabaseAuthExchangeParams(searchParams);
}
