import { createClient } from '@/lib/supabase/server';
import { listCircleFeed } from '@/lib/circle/circle-feed-core';
import { getCircleLastSeenAt } from '@/lib/circle/circle-read-state-core';
import { AuthenticatedCircleView } from '@/components/dashboard/authenticated-circle-view';
import { AppButton, PageHeader } from '@/components/dashboard/ui/dashboard-ui';

export default async function CirclePage() {
  const supabase = await createClient();
  const [feed, lastSeen] = await Promise.all([
    listCircleFeed(supabase, { filter: 'all' }),
    getCircleLastSeenAt(supabase),
  ]);

  if (feed.status === 'unauthenticated') {
    return (
      <div className="cc-app-page cc-app-page--1040 space-y-6">
        <PageHeader
          title="Circle"
          description="Sign in to follow public work from your Connections."
          actions={
            <AppButton variant="primary" href="/sign-in?redirect=%2Fdashboard%2Fcircle">
              Sign in
            </AppButton>
          }
        />
      </div>
    );
  }

  return (
    <AuthenticatedCircleView
      initialFeed={feed}
      initialLastSeenAt={lastSeen.ok ? lastSeen.lastSeenAt : null}
    />
  );
}
