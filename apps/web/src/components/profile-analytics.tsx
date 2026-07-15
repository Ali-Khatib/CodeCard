'use client';

import { useEffect } from 'react';
import { createSessionId, trackEvent } from '@codecard/analytics';
import { readProfileViewSourceFromSearch } from '@/lib/sharing/profile-view-source';

export function ProfileAnalytics({ profileId }: { profileId: string }) {
  useEffect(() => {
    const source = readProfileViewSourceFromSearch(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    void trackEvent('/api/analytics', {
      event_type: 'profile_view',
      profile_id: profileId,
      session_id: createSessionId(),
      source,
    });
  }, [profileId]);

  return null;
}
