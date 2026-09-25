import { authCallbackRedirectUrl, getAppOrigin, PASSWORD_RESET_COOLDOWN_MS } from '@/lib/auth/redirect';

export function passwordResetRedirectUrl(): string {
  return authCallbackRedirectUrl('/reset-password');
}

/** Same-origin verify URL for admin `generateLink` hashed tokens. Works in any browser. */
export function passwordResetTokenCallbackUrl(tokenHash: string): string {
  const url = new URL('/auth/callback', `${getAppOrigin()}/`);
  url.searchParams.set('token_hash', tokenHash);
  url.searchParams.set('type', 'recovery');
  url.searchParams.set('redirect', '/reset-password');
  return url.toString();
}

export function mapPasswordResetClientError(): string {
  return 'Something went wrong. Please try again in a moment.';
}

/** `lastSentAt` is the timestamp when the reset email was last requested. */
export function isRecoveryCooldownActive(lastSentAt: number | null, now = Date.now()): boolean {
  if (lastSentAt == null) return false;
  return now - lastSentAt < PASSWORD_RESET_COOLDOWN_MS;
}
