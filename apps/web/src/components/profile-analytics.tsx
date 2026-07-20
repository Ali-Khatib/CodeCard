'use client';

import { useEffect } from 'react';
import { createSessionId, trackEvent } from '@codecard/analytics';
import { readProfileViewSourceFromSearch } from '@/lib/sharing/profile-view-source';

/**
 * Fire-and-forget profile_view after paint. Never blocks LCP (WS14-T019).
 * Uses requestIdleCallback with a short timeout fallback; errors are swallowed.
 */
export function ProfileAnalytics({ profileId }: { profileId: string }) {
  useEffect(() => {
    let cancelled = false;
    const send = () => {
      if (cancelled) return;
      try {
        const source = readProfileViewSourceFromSearch(
          typeof window !== 'undefined' ? window.location.search : '',
        );
        void trackEvent('/api/analytics', {
          event_type: 'profile_view',
          profile_id: profileId,
          session_id: createSessionId(),
          source,
        });
      } catch {
        /* analytics must never blank the public profile */
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(send, { timeout: 2000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const t = globalThis.setTimeout(send, 1);
    return () => {
      cancelled = true;
      globalThis.clearTimeout(t);
    };
  }, [profileId]);

  return null;
}
