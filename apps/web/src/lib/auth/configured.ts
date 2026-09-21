import { getSupabasePublicKey, getSupabaseUrl } from '@/lib/supabase/public-key';

export function isAuthConfigured() {
  return Boolean(getSupabaseUrl() && getSupabasePublicKey());
}
