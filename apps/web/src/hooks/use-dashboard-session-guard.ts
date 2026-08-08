'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { handleSessionExpired } from '@/lib/auth/session-expiry';

/**
 * Redirects to sign-in only after an explicit sign-out.
 * A failed token refresh (network blip) must not look like "session expired"
 * and then stack a "connection interrupted" error on the next sign-in attempt.
 */
export function useDashboardSessionGuard() {
  const pathname = usePathname();
  const redirecting = useRef(false);

  useEffect(() => {
    if (!pathname?.startsWith('/dashboard') || pathname.startsWith('/dashboard/preview')) {
      return;
    }

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (redirecting.current) return;
      if (event === 'SIGNED_OUT' && !session) {
        redirecting.current = true;
        handleSessionExpired(pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname]);
}
