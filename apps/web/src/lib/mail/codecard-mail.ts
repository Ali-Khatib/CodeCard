import 'server-only';
import nodemailer from 'nodemailer';

export const CODECARD_MAILBOX = 'getcodecard@gmail.com';
const DEFAULT_FROM = `CodeCard <${CODECARD_MAILBOX}>`;

export type CodeCardMailMessage = {
  subject: string;
  text: string;
  html: string;
};

export async function sendCodeCardEmail(
  email: string,
  message: CodeCardMailMessage,
  env: Record<string, string | undefined> = process.env as Record<
    string,
    string | undefined
  >,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const from = env.WAITLIST_FROM_EMAIL?.trim() || DEFAULT_FROM;
  const gmailPass =
    env.GMAIL_APP_PASSWORD?.trim() || env.WAITLIST_GMAIL_APP_PASSWORD?.trim();
  const apiKey = env.RESEND_API_KEY?.trim();

  if (gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: CODECARD_MAILBOX,
          pass: gmailPass,
        },
      });
      const result = await transporter.sendMail({
        from,
        to: email,
        replyTo: CODECARD_MAILBOX,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      return Boolean(result.messageId || result.accepted?.length);
    } catch {
      if (!apiKey) return false;
    }
  }

  if (!apiKey) return false;

  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      reply_to: CODECARD_MAILBOX,
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });

  return response.ok;
}
