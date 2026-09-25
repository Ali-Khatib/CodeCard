import 'server-only';
import nodemailer from 'nodemailer';
import { getAppOrigin } from '@/lib/auth/redirect';

export const WAITLIST_CONTACT_EMAIL = ['getcodecard', 'gmail.com'].join('@');
const DEFAULT_FROM = `CodeCard <${WAITLIST_CONTACT_EMAIL}>`;

export function buildWaitlistConfirmation(origin: string) {
  const subject = "Yay — you're on the CodeCard waitlist";
  const text = [
    "Yay — you're on the CodeCard waitlist.",
    "We'll send all news, updates, and early access notes to this email.",
    'Talk soon,',
    'CodeCard',
    WAITLIST_CONTACT_EMAIL,
    origin,
  ].join('\n\n');
  const html = [
    `<p>Yay — you're on the CodeCard waitlist.</p>`,
    `<p>We'll send all news, updates, and early access notes to this email.</p>`,
    `<p>Talk soon,<br/>CodeCard<br/><a href="mailto:${WAITLIST_CONTACT_EMAIL}">${WAITLIST_CONTACT_EMAIL}</a></p>`,
    `<p><a href="${origin}">${origin}</a></p>`,
  ].join('');

  return { subject, text, html };
}

function resolveOrigin(env: Record<string, string | undefined>): string {
  const configured = env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      return getAppOrigin();
    }
  }
  return getAppOrigin();
}

async function sendViaGmail(
  email: string,
  from: string,
  message: ReturnType<typeof buildWaitlistConfirmation>,
  appPassword: string,
): Promise<boolean> {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: WAITLIST_CONTACT_EMAIL,
      pass: appPassword,
    },
  });

  const result = await transporter.sendMail({
    from,
    to: email,
    replyTo: WAITLIST_CONTACT_EMAIL,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });

  return Boolean(result.messageId || result.accepted?.length);
}

async function sendViaResend(
  email: string,
  from: string,
  message: ReturnType<typeof buildWaitlistConfirmation>,
  apiKey: string,
  fetchImpl: typeof fetch,
): Promise<boolean> {
  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      reply_to: WAITLIST_CONTACT_EMAIL,
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });

  return response.ok;
}

export async function sendWaitlistConfirmationEmail(
  email: string,
  env: Record<string, string | undefined> = process.env as Record<
    string,
    string | undefined
  >,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const from = env.WAITLIST_FROM_EMAIL?.trim() || DEFAULT_FROM;
  const message = buildWaitlistConfirmation(resolveOrigin(env));
  const gmailPass =
    env.GMAIL_APP_PASSWORD?.trim() || env.WAITLIST_GMAIL_APP_PASSWORD?.trim();
  const apiKey = env.RESEND_API_KEY?.trim();

  if (gmailPass) {
    try {
      return await sendViaGmail(email, from, message, gmailPass);
    } catch {
      if (!apiKey) return false;
    }
  }

  if (!apiKey) return false;
  return sendViaResend(email, from, message, apiKey, fetchImpl);
}
