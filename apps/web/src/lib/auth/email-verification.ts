type VerificationUser = {
  email?: string | null;
  email_confirmed_at?: string | null;
  identities?: Array<{ provider: string }> | null;
  app_metadata?: Record<string, unknown> | null;
};

const OAUTH_PROVIDERS = new Set(['google', 'github', 'gitlab', 'apple', 'azure', 'facebook']);

/** True for email-password users who still need to confirm their inbox. */
export function userNeedsEmailVerification(user: VerificationUser): boolean {
  if (!user.email) return false;
  if (user.email_confirmed_at) return false;

  const identities = user.identities ?? [];
  const hasEmailIdentity = identities.some((identity) => identity.provider === 'email');
  const hasOAuthIdentity = identities.some((identity) => OAUTH_PROVIDERS.has(identity.provider));

  if (hasOAuthIdentity && !hasEmailIdentity) return false;

  const provider = String(user.app_metadata?.provider ?? '');
  if (OAUTH_PROVIDERS.has(provider) && !hasEmailIdentity) return false;

  return true;
}

export const EMAIL_VERIFICATION_GENERIC_SUCCESS =
  'If your account still needs verification, a new email has been sent.';

export const EMAIL_VERIFICATION_GENERIC_ERROR =
  'Could not send a verification email right now. Try again shortly.';

export const EMAIL_VERIFICATION_COOLDOWN_MS = 60_000;

export function isVerificationCooldownActive(lastSentAt: number | null, now = Date.now()): boolean {
  if (lastSentAt == null) return false;
  return now - lastSentAt < EMAIL_VERIFICATION_COOLDOWN_MS;
}
