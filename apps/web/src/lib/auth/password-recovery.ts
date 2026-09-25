import { authCallbackRedirectUrl, PASSWORD_RESET_COOLDOWN_MS } from '@/lib/auth/redirect';

export function passwordResetRedirectUrl(): string {
  return authCallbackRedirectUrl('/reset-password');
}

export function mapPasswordResetClientError(): string {
  return 'Something went wrong. Please try again in a moment.';
}

/** `lastSentAt` is the timestamp when the reset email was last requested. */
export function isRecoveryCooldownActive(lastSentAt: number | null, now = Date.now()): boolean {
  if (lastSentAt == null) return false;
  return now - lastSentAt < PASSWORD_RESET_COOLDOWN_MS;
}
