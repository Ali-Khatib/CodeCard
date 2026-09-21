/** Supabase publishable (new) or anon (legacy) key — safe for browser. */
export function getSupabasePublicKey(): string | undefined {
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (!key || key.toLowerCase().includes('placeholder')) return undefined;
  return key;
}

/**
 * Canonical GoTrue/API origin. Trailing slashes and paths in env break the client.
 */
export function getSupabaseUrl(): string | undefined {
  const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  if (!raw) return undefined;
  try {
    const parsed = new URL(raw);
    if (parsed.hostname === 'placeholder.supabase.co') return undefined;
    return parsed.origin;
  } catch {
    return undefined;
  }
}

export function isSupabasePublicKeyConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublicKey());
}
