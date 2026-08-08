import { mapAuthFormError } from '@/lib/auth/map-auth-form-error';

export type SignUpAuthResult = {
  user: { id: string; email?: string | null } | null;
  session: { access_token?: string } | null;
};

export type SignUpOutcome =
  | { kind: 'error'; message: string }
  | { kind: 'needs_email_confirmation'; email: string }
  | { kind: 'authenticated' };

/**
 * Interprets supabase.auth.signUp() for Confirm Email enabled vs disabled.
 * A null session with a user is success-pending-confirmation — not session expiry.
 */
export function resolveSignUpOutcome(args: {
  data: SignUpAuthResult;
  error: { message?: string } | null;
  email: string;
}): SignUpOutcome {
  if (args.error) {
    return {
      kind: 'error',
      message: mapAuthFormError(args.error.message, 'sign-up'),
    };
  }

  if (!args.data.user) {
    return {
      kind: 'error',
      message: mapAuthFormError(null, 'sign-up'),
    };
  }

  if (!args.data.session) {
    return {
      kind: 'needs_email_confirmation',
      email: args.email.trim(),
    };
  }

  return { kind: 'authenticated' };
}

export const SIGNUP_CONFIRMATION_TITLE = 'Check your email';

export function signupConfirmationBody(email: string): string {
  return `We created your account. Open the confirmation link we sent to ${email}. After that you will land on a short setup guide, then you can sign in.`;
}
