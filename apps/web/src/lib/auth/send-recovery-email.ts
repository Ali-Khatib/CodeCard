import 'server-only';
import { CODECARD_MAILBOX, sendCodeCardEmail } from '@/lib/mail/codecard-mail';

export function buildPasswordResetEmail(resetUrl: string) {
  return {
    subject: 'Reset your CodeCard password',
    text: [
      'Reset your CodeCard password with this link:',
      resetUrl,
      'If you did not ask for this, you can ignore this email.',
      'CodeCard',
      CODECARD_MAILBOX,
    ].join('\n\n'),
    html: [
      `<p>Reset your CodeCard password:</p>`,
      `<p><a href="${resetUrl}">Reset password</a></p>`,
      `<p>If you did not ask for this, you can ignore this email.</p>`,
      `<p>CodeCard<br/><a href="mailto:${CODECARD_MAILBOX}">${CODECARD_MAILBOX}</a></p>`,
    ].join(''),
  };
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  env: Record<string, string | undefined> = process.env as Record<
    string,
    string | undefined
  >,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  return sendCodeCardEmail(email, buildPasswordResetEmail(resetUrl), env, fetchImpl);
}
