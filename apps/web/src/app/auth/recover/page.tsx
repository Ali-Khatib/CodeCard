'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabasePublicKeyConfigured } from '@/lib/supabase/public-key';

/**
 * Handles implicit/hash recovery after `/auth/callback` is rewritten here.
 * Query-token recoveries still go through the server callback.
 */
export default function AuthRecoverPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isSupabasePublicKeyConfigured()) {
      setFailed(true);
      return;
    }

    const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
    const params = new URLSearchParams(hash);
    const hasHashToken = Boolean(params.get('access_token'));
    const supabase = createClient();
    let cancelled = false;
    let navigated = false;

    function go() {
      if (cancelled || navigated) return;
      navigated = true;
      router.replace('/auth/mark-recovery');
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        go();
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });

    const timeout = window.setTimeout(() => {
      if (!navigated && !hasHashToken) {
        setFailed(true);
        router.replace('/auth/error?reason=missing_code&redirect=%2Freset-password');
      }
    }, 1500);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [router]);

  if (failed) return null;

  return (
    <p className="p-6 text-center text-[14px] text-[#7a7876]" role="status">
      Opening your reset link…
    </p>
  );
}
