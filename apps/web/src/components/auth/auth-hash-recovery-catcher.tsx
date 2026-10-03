'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { defaultPostAuthRedirectForType } from '@/lib/auth/auth-link-forward';
import { parseRecoveryHash } from '@/lib/auth/recovery-hash';
import { isSupabasePublicKeyConfigured } from '@/lib/supabase/public-key';

/**
 * Implicit/hash recovery links (`#access_token=...&type=recovery`) are invisible
 * to middleware. Establish the session client-side and route to reset-password.
 */
export function AuthHashRecoveryCatcher() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isSupabasePublicKeyConfigured()) return;
    if (typeof window === 'undefined') return;
    if (pathname.startsWith('/reset-password') || pathname.startsWith('/auth/recover')) return;

    const tokens = parseRecoveryHash(window.location.hash);
    if (!tokens) return;

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const type = params.get('type');
    const destination =
      type === 'recovery' ||
      (!type && (pathname === '/' || pathname === '/landing'))
        ? '/auth/mark-recovery'
        : defaultPostAuthRedirectForType(type);

    let cancelled = false;
    let navigated = false;
    const supabase = createClient();

    function go() {
      if (cancelled || navigated) return;
      navigated = true;
      window.history.replaceState(null, '', `${pathname}${window.location.search}`);
      router.replace(destination);
      router.refresh();
    }

    void supabase.auth
      .setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      })
      .then(({ data, error }) => {
        if (cancelled || error || !data.session) return;
        go();
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
