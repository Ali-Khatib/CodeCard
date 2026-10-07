/**
 * Force browser-session auth cookies (no Max-Age / Expires) so closing the
 * browser clears the session. Tab-close / idle sign-out clears them sooner.
 */
export const SESSION_ONLY_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export function toSessionOnlyCookieOptions(
  options?: Record<string, unknown> | null,
  value?: string,
): Record<string, unknown> {
  const next: Record<string, unknown> = {
    ...SESSION_ONLY_COOKIE_OPTIONS,
    ...(options ?? {}),
  };
  delete next.name;
  delete next.expires;
  delete next.lifetime;

  const clearing = value === '' || options?.maxAge === 0;
  if (clearing) {
    next.maxAge = 0;
  } else {
    delete next.maxAge;
  }

  return next;
}

/** Serialize a cookie for `document.cookie` without a persistent Max-Age. */
export function serializeSessionCookie(
  name: string,
  value: string,
  options?: Record<string, unknown> | null,
): string {
  const opts = toSessionOnlyCookieOptions(options, value);
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
  const path = typeof opts.path === 'string' ? opts.path : '/';
  parts.push(`Path=${path}`);
  if (opts.sameSite) parts.push(`SameSite=${String(opts.sameSite)}`);
  if (opts.secure) parts.push('Secure');
  if (typeof opts.maxAge === 'number') parts.push(`Max-Age=${opts.maxAge}`);
  return parts.join('; ');
}
