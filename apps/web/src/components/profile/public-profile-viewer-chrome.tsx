'use client';

import { PublicProfileConnectionControl } from './public-profile-connection-control';
import { PublicReportDialog } from '@/components/moderation/public-report-dialog';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

type ViewerConnection = {
  isOwnProfile: boolean;
  isAuthenticated: boolean;
  initiallyConnected: boolean;
  initialConnectionId: string | null;
};

const ANON_VIEWER: ViewerConnection = {
  isOwnProfile: false,
  isAuthenticated: false,
  initiallyConnected: false,
  initialConnectionId: null,
};

/**
 * Auth-aware connect/report chrome. Loaded after the ATF shell paints so the
 * Supabase browser client is not on the public-profile critical path (WS14-T019).
 */
export function PublicProfileViewerChrome({
  profileId,
  profileSlug,
  displayName,
  connectionControl,
}: {
  profileId: string;
  profileSlug: string;
  displayName: string;
  connectionControl?: ViewerConnection | null;
}) {
  const [viewer, setViewer] = useState<ViewerConnection>(
    connectionControl ?? ANON_VIEWER,
  );

  useEffect(() => {
    if (connectionControl) {
      setViewer(connectionControl);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setViewer(ANON_VIEWER);
          return;
        }

        const { data: viewerProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('owner_user_id', user.id)
          .maybeSingle();

        const isOwnProfile = viewerProfile?.id === profileId;
        let initiallyConnected = false;
        let initialConnectionId: string | null = null;

        if (!isOwnProfile) {
          const { data: existing } = await supabase
            .from('saved_connections')
            .select('id')
            .eq('owner_user_id', user.id)
            .eq('saved_profile_id', profileId)
            .maybeSingle();
          initiallyConnected = Boolean(existing);
          initialConnectionId = existing?.id ?? null;
        }

        if (!cancelled) {
          setViewer({
            isOwnProfile,
            isAuthenticated: true,
            initiallyConnected,
            initialConnectionId,
          });
        }
      } catch {
        if (!cancelled) setViewer(ANON_VIEWER);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connectionControl, profileId]);

  if (viewer.isOwnProfile) return null;

  return (
    <>
      <PublicProfileConnectionControl
        profileId={profileId}
        profileSlug={profileSlug}
        displayName={displayName}
        isOwnProfile={viewer.isOwnProfile}
        isAuthenticated={viewer.isAuthenticated}
        initiallyConnected={viewer.initiallyConnected}
        initialConnectionId={viewer.initialConnectionId}
      />
      <PublicReportDialog targetType="profile" targetId={profileId} />
    </>
  );
}
