import { STORAGE_BUCKETS } from '@codecard/config';
import type { SupabaseClient } from '@supabase/supabase-js';

const LEGACY_TRUSTED_HOSTS = new Set(['images.unsplash.com']);

export function getPublicAvatarUrl(supabase: SupabaseClient, storagePath: string): string {
  const { data } = supabase.storage.from(STORAGE_BUCKETS.avatars).getPublicUrl(storagePath);
  return data.publicUrl;
}

export function isTrustedAvatarHost(hostname: string): boolean {
  if (hostname.endsWith('.supabase.co')) {
    return true;
  }
  return LEGACY_TRUSTED_HOSTS.has(hostname);
}

export function isTrustedAvatarImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    return isTrustedAvatarHost(parsed.hostname);
  } catch {
    return false;
  }
}

export function profileAvatarAltText(displayName: string): string {
  const trimmed = displayName.trim();
  return trimmed ? `${trimmed} avatar` : 'Profile avatar';
}
