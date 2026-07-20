import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabasePublicKey } from '@/lib/supabase/public-key';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabasePublicKey()!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    },
  );
}

/**
 * Cookie-free anon client for public ISR routes (WS14-T019).
 * Does not call `cookies()`, so `revalidate` can cache anonymous HTML.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabasePublicKey()!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function createServiceClient() {
  const { requireServerSecret } = await import('@/lib/security/env');
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    requireServerSecret('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
