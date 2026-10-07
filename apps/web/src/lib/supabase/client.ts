import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicKey, getSupabaseUrl } from '@/lib/supabase/public-key';
import { serializeSessionCookie } from '@/lib/auth/session-cookie-options';

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function readBrowserCookies(): { name: string; value: string }[] {
  if (typeof document === 'undefined') return [];
  return document.cookie.split(';').flatMap((part) => {
    const trimmed = part.trim();
    if (!trimmed) return [];
    const eq = trimmed.indexOf('=');
    if (eq === -1) return [{ name: safeDecode(trimmed), value: '' }];
    return [
      {
        name: safeDecode(trimmed.slice(0, eq)),
        value: safeDecode(trimmed.slice(eq + 1)),
      },
    ];
  });
}

export function createClient() {
  return createBrowserClient(
    getSupabaseUrl()!,
    getSupabasePublicKey()!,
    {
      cookies: {
        getAll() {
          return readBrowserCookies();
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') return;
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = serializeSessionCookie(name, value, options);
          });
        },
      },
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    },
  );
}
