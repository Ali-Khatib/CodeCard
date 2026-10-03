'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { parseRecoveryHash } from '@/lib/auth/recovery-hash';
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

    const supabase = createClient();
    const tokens = parseRecoveryHash(window.location.hash);
    let cancelled = false;
    let navigated = false;

    function go() {
      if (cancelled || navigated) return;
      navigated = true;
      router.replace('/auth/mark-recovery');
    }

    function fail() {
      if (cancelled || navigated) return;
      navigated = true;
      setFailed(true);
      router.replace('/auth/error?reason=missing_code&redirect=%2Freset-password');
    }

    void (async () => {
      if (tokens) {
        const { data, error } = await supabase.auth.setSession({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });
        if (cancelled) return;
        if (!error && data.session) {
          go();
          return;
        }
        fail();
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        go();
        return;
      }
      fail();
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (failed) return null;

  return (
    <p className="p-6 text-center text-[14px] text-[#7a7876]" role="status">
      Opening your reset link…
    </p>
  );
}
