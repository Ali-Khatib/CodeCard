import 'server-only';
import { getAppOrigin } from '@/lib/auth/redirect';

const DEFAULT_FROM = 'CodeCard <hello@codecard.app>';

export async function sendWaitlistConfirmationEmail(
  email: string,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const from = env.WAITLIST_FROM_EMAIL?.trim() || DEFAULT_FROM;
  const configured = env.NEXT_PUBLIC_APP_URL?.trim();
  let origin = 'https://codecard.app';
  if (configured) {
    try {
      origin = new URL(configured).origin;
    } catch {
      origin = getAppOrigin();
    }
  } else {
    origin = getAppOrigin();
  }

  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "You're in — CodeCard waitlist",
      text: [
        "You're in.",
        "We'll let you know when CodeCard is ready.",
        origin,
      ].join('\n\n'),
      html: `<p>You're in.</p><p>We'll let you know when CodeCard is ready.</p><p><a href="${origin}">${origin}</a></p>`,
    }),
  });

  return response.ok;
}
