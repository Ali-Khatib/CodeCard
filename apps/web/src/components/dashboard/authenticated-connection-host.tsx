'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const ConnectionRequestHost = dynamic(
  () =>
    import('@/components/dashboard/connection-request-host').then(
      (mod) => mod.ConnectionRequestHost,
    ),
  { ssr: false },
);

/** Incoming connection call on pages that are not already inside the dashboard shell. */
export function AuthenticatedConnectionHost() {
  const pathname = usePathname() ?? '';
  const covered =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/demo') ||
    pathname.startsWith('/admin');
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (covered) return;
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!cancelled) setSignedIn(Boolean(user));
      } catch {
        if (!cancelled) setSignedIn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [covered]);

  if (covered || !signedIn) return null;
  return <ConnectionRequestHost enabled />;
}
