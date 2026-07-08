import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicKey } from '@/lib/supabase/public-key';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabasePublicKey()!,
  );
}
