export type AuthFormContext = 'sign-in' | 'sign-up';

/**
 * Maps vendor/raw auth errors to safe, plain-language copy for the UI.
 * Does not change authentication behavior — presentation only.
 */
export function mapAuthFormError(raw: string | null | undefined, context: AuthFormContext): string {
  const message = (raw ?? '').trim();
  const lower = message.toLowerCase();

  if (!message) {
    return context === 'sign-in'
      ? 'Could not sign in. Please try again.'
      : 'Could not create your account. Please try again.';
  }

  if (
    lower.includes('invalid login') ||
    lower.includes('invalid credentials') ||
    lower.includes('email not confirmed') ||
    lower.includes('invalid email or password')
  ) {
    return 'Those credentials don’t match. Check your email and password.';
  }

  if (
    lower.includes('already registered') ||
    lower.includes('already been registered') ||
    lower.includes('user already exists')
  ) {
    return 'An account with this email already exists. Sign in instead.';
  }

  if (
    lower.includes('password must') ||
    lower.includes('password should') ||
    lower.includes('weak password') ||
    lower.includes('at least 1 character') ||
    lower.includes('at least one character')
  ) {
    return 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.';
  }

  if (lower.includes('session') && lower.includes('expired')) {
    // Sign-up must never surface session-expiry copy for a null post-signUp session.
    return context === 'sign-in'
      ? 'Your session expired. Please sign in again.'
      : 'Could not create your account. Please try again.';
  }

  if (
    lower.includes('network') ||
    lower.includes('failed to fetch') ||
    lower.includes('timeout') ||
    lower.includes('offline') ||
    lower.includes('load failed') ||
    lower.includes('networkerror') ||
    lower.includes('authretryablefetcherror') ||
    lower.includes('aborted')
  ) {
    return 'Can’t reach Supabase from this browser. Disable ad blockers/VPN for this site, hard-refresh, then try again.';
  }

  if (lower.includes('rate limit') || lower.includes('too many') || lower.includes('429')) {
    return 'Too many attempts. Wait a moment and try again.';
  }

  if (lower.includes('oauth') && (lower.includes('cancel') || lower.includes('denied'))) {
    return 'GitHub sign-in was cancelled.';
  }

  if (
    lower.includes('provider is not enabled') ||
    lower.includes('unsupported provider') ||
    lower.includes('provider_disabled')
  ) {
    return 'GitHub sign-in is not enabled yet. Use email for now, or ask the project owner to turn on GitHub under Supabase → Authentication → Providers.';
  }

  if (lower.includes('oauth') || lower.includes('provider')) {
    return 'GitHub sign-in failed. Please try again.';
  }

  // Already-safe validation copy from Zod / local checks
  if (
    !lower.includes('supabase') &&
    !lower.includes('jwt') &&
    !lower.includes('postgres') &&
    !lower.includes('stack') &&
    !lower.includes('sql') &&
    message.length < 160
  ) {
    return message;
  }

  return context === 'sign-in'
    ? 'Could not sign in. Please try again.'
    : 'Could not create your account. Please try again.';
}
