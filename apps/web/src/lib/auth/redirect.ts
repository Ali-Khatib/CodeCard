const DEFAULT_FALLBACK = '/dashboard';

/** Allow only same-origin relative paths for post-auth redirects. */
export function sanitizeInternalRedirect(
  path: string | null | undefined,
  fallback = DEFAULT_FALLBACK,
): string {
  if (!path) return fallback;
  if (!path.startsWith('/') || path.startsWith('//')) return fallback;
  if (path.includes('://') || path.includes('\\')) return fallback;
  return path;
}

export function getAppOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

export function authCallbackRedirectUrl(redirectPath: string): string {
  const safe = sanitizeInternalRedirect(redirectPath, '/dashboard');
  return `${getAppOrigin()}/auth/callback?redirect=${encodeURIComponent(safe)}`;
}

export const PASSWORD_RESET_GENERIC_SUCCESS =
  'If an account exists for this email, a reset link has been sent.';

export const PASSWORD_RESET_GENERIC_ERROR =
  'Something went wrong. Please try again in a moment.';

export const PASSWORD_RESET_COOLDOWN_MS = 60_000;
