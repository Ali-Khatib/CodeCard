import { sanitizeInternalRedirect } from '@/lib/auth/redirect';

export const SESSION_EXPIRED_MESSAGE = 'Your session expired. Please sign in again.';

export const SIGN_IN_REASONS = ['session_expired'] as const;
export type SignInReason = (typeof SIGN_IN_REASONS)[number];

let clientRedirectInFlight = false;

export function buildSignInHref(
  returnPath?: string | null,
  reason?: SignInReason,
): string {
  const safe = sanitizeInternalRedirect(returnPath);
  const params = new URLSearchParams();
  if (safe !== '/dashboard') {
    params.set('redirect', safe);
  }
  if (reason) {
    params.set('reason', reason);
  }
  const query = params.toString();
  return query ? `/sign-in?${query}` : '/sign-in';
}

export function hasSupabaseAuthCookie(
  cookies: { name: string; value: string }[],
): boolean {
  return cookies.some(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'),
  );
}

export function isAuthSessionMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message.toLowerCase()
      : '';
  return (
    message.includes('auth session missing') ||
    message.includes('session expired') ||
    message.includes('not authenticated') ||
    message.includes('jwt expired')
  );
}

export function isUnauthorizedResponse(response: Response): boolean {
  return response.status === 401;
}

export function shouldTreatAsSessionExpiry(response: Response): boolean {
  return response.status === 401;
}

export function resetSessionExpiryRedirectLock(): void {
  clientRedirectInFlight = false;
}

export function handleSessionExpired(returnPath?: string | null): void {
  if (typeof window === 'undefined') return;
  if (clientRedirectInFlight) return;
  clientRedirectInFlight = true;

  const href = buildSignInHref(returnPath ?? window.location.pathname, 'session_expired');
  window.location.replace(href);
}

export async function handleUnauthorizedResponse(
  response: Response,
  returnPath?: string | null,
): Promise<void> {
  if (!shouldTreatAsSessionExpiry(response)) return;
  handleSessionExpired(returnPath);
}

export function signInStatusMessage(reason: string | null | undefined): string | null {
  if (reason === 'session_expired') return SESSION_EXPIRED_MESSAGE;
  return null;
}
