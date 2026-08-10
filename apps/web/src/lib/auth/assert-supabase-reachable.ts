import { getSupabasePublicKey } from '@/lib/supabase/public-key';

/**
 * Confirms the browser can reach this project's Supabase Auth API.
 * Throws a fetch-style Error when blocked (adblock, offline, bad URL).
 */
export async function assertSupabaseAuthReachable(): Promise<void> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const key = getSupabasePublicKey();
  if (!base || !key) {
    throw new Error('failed to fetch');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(`${base}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok && response.status !== 401) {
      throw new Error('failed to fetch');
    }
  } catch {
    throw new Error('failed to fetch');
  } finally {
    clearTimeout(timer);
  }
}
