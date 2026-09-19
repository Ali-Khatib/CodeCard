import { waitlistSignupSchema } from '@codecard/validation';

export const WAITLIST_STORAGE_KEY = 'codecard.waitlist.emails';

export type WaitlistValidationError = 'required' | 'invalid';

export type WaitlistSubmitResult =
  | { ok: true; status: 'joined' | 'already' }
  | { ok: false; error: WaitlistValidationError | 'unavailable' };

export function normalizeWaitlistEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateWaitlistEmail(raw: string): WaitlistValidationError | null {
  const parsed = waitlistSignupSchema.safeParse({ email: raw, website: '' });
  if (parsed.success) return null;
  const message = parsed.error.errors[0]?.message ?? '';
  if (/join the waitlist/i.test(message) || raw.trim() === '') return 'required';
  return 'invalid';
}

export function waitlistValidationMessage(
  error: WaitlistValidationError | 'unavailable',
): string {
  if (error === 'required') return 'Enter your email to join the waitlist.';
  if (error === 'unavailable') return 'Something went wrong. Please try again.';
  return 'Enter a valid email address.';
}

type WaitlistApiSuccess = { ok: true; status: 'joined' | 'already' };

export async function submitWaitlistEmail(
  raw: string,
  extras: { website?: string } = {},
): Promise<WaitlistSubmitResult> {
  const error = validateWaitlistEmail(raw);
  if (error) return { ok: false, error };

  const email = normalizeWaitlistEmail(raw);

  try {
    const response = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, website: extras.website ?? '' }),
    });

    if (response.status === 429) return { ok: false, error: 'unavailable' };
    if (!response.ok) {
      if (response.status === 422) return { ok: false, error: 'invalid' };
      return { ok: false, error: 'unavailable' };
    }

    const payload = (await response.json()) as WaitlistApiSuccess;
    if (payload?.ok && (payload.status === 'joined' || payload.status === 'already')) {
      return { ok: true, status: payload.status };
    }
    return { ok: false, error: 'unavailable' };
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}
