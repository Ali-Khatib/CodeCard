export const WAITLIST_STORAGE_KEY = 'codecard.waitlist.emails';

export type WaitlistValidationError = 'required' | 'invalid';

export type WaitlistSubmitResult =
  | { ok: true; status: 'joined' | 'already' }
  | { ok: false; error: WaitlistValidationError };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeWaitlistEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateWaitlistEmail(raw: string): WaitlistValidationError | null {
  const trimmed = raw.trim();
  if (!trimmed) return 'required';
  if (!EMAIL_PATTERN.test(trimmed)) return 'invalid';
  return null;
}

export function waitlistValidationMessage(error: WaitlistValidationError): string {
  if (error === 'required') return 'Enter your email to join the waitlist.';
  return 'Enter a valid email address.';
}

function readStoredEmails(storage: Pick<Storage, 'getItem'>): string[] {
  try {
    const raw = storage.getItem(WAITLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

/**
 * Isolated waitlist submit. Persists locally until a backend is connected.
 * Do not invent remote endpoints here — swap the storage/adapter later.
 */
export async function submitWaitlistEmail(
  raw: string,
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null,
): Promise<WaitlistSubmitResult> {
  const error = validateWaitlistEmail(raw);
  if (error) return { ok: false, error };

  const email = normalizeWaitlistEmail(raw);
  const store =
    storage === undefined
      ? typeof window !== 'undefined'
        ? window.localStorage
        : null
      : storage;

  if (!store) {
    return { ok: true, status: 'joined' };
  }

  const existing = readStoredEmails(store);
  if (existing.includes(email)) {
    return { ok: true, status: 'already' };
  }

  store.setItem(WAITLIST_STORAGE_KEY, JSON.stringify([...existing, email]));
  return { ok: true, status: 'joined' };
}
