import { createClient } from '@/lib/supabase/server';
import { AuthenticatedConnectionsClient } from '@/components/dashboard/authenticated-connections-client';
import { listOwnerConnections } from '@/lib/connections/connections-core';
import {
  listOwnerCollections,
  listOwnerMembershipMap,
} from '@/lib/connections/collections-core';
import { mapOwnerConnectionToCard } from '@/lib/connections/map-owner-connection';
import { EMPTY_STATE_COPY } from '@/lib/dashboard/empty-state-copy';
import { AppButton, PageHeader } from '@/components/dashboard/ui/dashboard-ui';

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [result, collectionsResult, membershipResult, profileResult] = await Promise.all([
    listOwnerConnections(supabase),
    listOwnerCollections(supabase),
    listOwnerMembershipMap(supabase),
    user
      ? supabase.from('profiles').select('slug').eq('owner_user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (result.error && result.code === 'UNAUTHENTICATED') {
    return (
      <div className="cc-app-page cc-app-page--1040 space-y-6">
        <PageHeader
          title={EMPTY_STATE_COPY.connections.title}
          description="Sign in first, then start stacking people."
          actions={
            <AppButton variant="primary" href="/sign-in?redirect=%2Fdashboard%2Fconnections">
              Sign in
            </AppButton>
          }
        />
      </div>
    );
  }

  if (result.error && result.code === 'TEMPORARY_FAILURE') {
    return (
      <div className="cc-app-page cc-app-page--1040 space-y-6">
        <PageHeader
          title={EMPTY_STATE_COPY.connections.title}
          description="Connections hiccuped for a second. Hit retry and we are right back to adding people."
          actions={
            <AppButton variant="primary" href="/dashboard/connections">
              Retry
            </AppButton>
          }
        />
        <p className="text-[14px] text-[var(--app-smoke)]" role="alert">
          {EMPTY_STATE_COPY.connections.description}
        </p>
      </div>
    );
  }

  const cards = result.connections.map(mapOwnerConnectionToCard);

  return (
    <AuthenticatedConnectionsClient
      initialConnections={cards}
      initialCollections={collectionsResult.collections}
      initialMemberships={membershipResult.memberships}
      profileSlug={profileResult.data?.slug ?? null}
    />
  );
}
