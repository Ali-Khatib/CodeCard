import { getSupabasePublicKey } from '@/lib/supabase/public-key';

export function isAuthConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && getSupabasePublicKey());
}
