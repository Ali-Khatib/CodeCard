'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { defaultPostAuthRedirectForType } from '@/lib/auth/auth-link-forward';
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
    if (pathname.startsWith('/auth/callback') || pathname.startsWith('/reset-password')) return;

    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;

    const params = new URLSearchParams(hash);
    if (!params.get('access_token')) return;

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;
      if (
        event === 'PASSWORD_RECOVERY' ||
        event === 'SIGNED_IN' ||
        (event === 'INITIAL_SESSION' && type === 'recovery')
      ) {
        go();
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  return null;
}
