import { STORAGE_BUCKETS } from '@codecard/config';
import type { SupabaseClient } from '@supabase/supabase-js';

export function getPublicProjectMediaUrl(
  supabase: SupabaseClient,
  storagePath: string,
): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.projectMedia)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

export function isAbsoluteMediaUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function resolveProjectMediaDisplayUrl(
  supabase: SupabaseClient,
  storagePath: string,
): string {
  if (isAbsoluteMediaUrl(storagePath)) {
    return storagePath;
  }
  return getPublicProjectMediaUrl(supabase, storagePath);
}

export function createProjectMediaUrlResolver(supabase: SupabaseClient) {
  return (storagePath: string) => resolveProjectMediaDisplayUrl(supabase, storagePath);
}
