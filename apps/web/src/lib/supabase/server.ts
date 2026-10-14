/**
 * Server-only Supabase entrypoints, including the service-role client.
 * The `server-only` guard turns an accidental client import into a build
 * failure instead of a runtime surprise.
 */
import 'server-only';
import { cache } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { toSessionOnlyCookieOptions } from '@/lib/auth/session-cookie-options';
import { getSupabasePublicKey, getSupabaseUrl } from '@/lib/supabase/public-key';

/**
 * One cookie-backed client per server request.
 * `getUser()` validates the session with Auth once; later calls in the same
 * request reuse that result instead of repeating the network round trip.
 */
export const createClient = cache(async function createClient() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    getSupabaseUrl()!,
    getSupabasePublicKey()!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, toSessionOnlyCookieOptions(options, value)),
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    },
  );

  const getUser = supabase.auth.getUser.bind(supabase.auth);
  let userLookup: ReturnType<typeof getUser> | null = null;
  supabase.auth.getUser = ((jwt?: string) => {
    if (typeof jwt === 'string') return getUser(jwt);
    userLookup ??= getUser();
    return userLookup;
  }) as typeof supabase.auth.getUser;

  return supabase;
});

/**
 * Cookie-free anon client for public ISR routes (WS14-T019).
 * Does not call `cookies()`, and tags fetches with `revalidate` so Next can
 * cache anonymous public reads (Next 15 defaults fetch to no-store).
 */
export function createPublicClient() {
  return createSupabaseClient(
    getSupabaseUrl()!,
    getSupabasePublicKey()!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => {
          const nextInit = {
            ...init,
            next: { revalidate: 60 },
          } as RequestInit & { next: { revalidate: number } };
          return fetch(input, nextInit);
        },
      },
    },
  );
}

export async function createServiceClient() {
  const { requireServerSecret } = await import('@/lib/security/env');
  return createSupabaseClient(
    getSupabaseUrl()!,
    requireServerSecret('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
