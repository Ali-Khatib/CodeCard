import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicKey, getSupabaseUrl } from '@/lib/supabase/public-key';

export function createClient() {
  return createBrowserClient(
    getSupabaseUrl()!,
    getSupabasePublicKey()!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    },
  );
}
