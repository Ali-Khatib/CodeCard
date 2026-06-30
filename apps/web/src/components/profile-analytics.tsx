'use client';

import { useEffect } from 'react';
import { createSessionId, trackEvent } from '@codecard/analytics';

export function ProfileAnalytics({ profileId }: { profileId: string }) {
  useEffect(() => {
    void trackEvent('/api/analytics', {
      event_type: 'profile_view',
      profile_id: profileId,
      session_id: createSessionId(),
      source: 'direct_link',
    });
  }, [profileId]);

  return null;
}
