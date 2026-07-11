import { authCallbackRedirectUrl } from '@/lib/auth/redirect';

export function passwordResetRedirectUrl(): string {
  return authCallbackRedirectUrl('/reset-password');
}

export function mapPasswordResetClientError(): string {
  return 'Something went wrong. Please try again in a moment.';
}

export function isRecoveryCooldownActive(lastSentAt: number | null, now = Date.now()): boolean {
  if (lastSentAt == null) return false;
  return now - lastSentAt < 60_000;
}
