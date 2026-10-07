/**
 * A short browser lease that dies after the last CodeCard tab closes.
 * Auth cookies stay session-scoped, but browsers often restore those.
 * Without this lease, Sign in treats a restored cookie as an active login
 * and sends the visitor straight into the account.
 */
export const SESSION_LEASE_COOKIE = 'cc-session-lease';
export const SESSION_LEASE_MAX_AGE_SECONDS = 20;
/** Last tab is unloading — long enough for a refresh, gone if they left. */
export const SESSION_LEASE_CLOSE_MAX_AGE_SECONDS = 3;

export function hasSessionLease(
  cookies: { name: string; value?: string }[],
): boolean {
  return cookies.some(
    (cookie) => cookie.name === SESSION_LEASE_COOKIE && Boolean(cookie.value),
  );
}

export function sessionLeaseCookieOptions(maxAge = SESSION_LEASE_MAX_AGE_SECONDS) {
  return {
    path: '/',
    maxAge,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  };
}

export function serializeSessionLeaseCookie(
  maxAge = SESSION_LEASE_MAX_AGE_SECONDS,
): string {
  const parts = [
    `${SESSION_LEASE_COOKIE}=1`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'SameSite=Lax',
  ];
  if (typeof location !== 'undefined' && location.protocol === 'https:') {
    parts.push('Secure');
  }
  return parts.join('; ');
}

export function supabaseAuthCookieNames(cookies: { name: string }[]): string[] {
  return cookies
    .filter((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'))
    .map((cookie) => cookie.name);
}
