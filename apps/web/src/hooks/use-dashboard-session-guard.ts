'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { handleSessionExpired } from '@/lib/auth/session-expiry';

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

      const sessionLost =
        !session &&
        (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED');

      if (sessionLost) {
        redirecting.current = true;
        handleSessionExpired(pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname]);
}
