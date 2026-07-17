import { createClient } from '@/lib/supabase/server';
import { AuthenticatedConnectionsClient } from '@/components/dashboard/authenticated-connections-client';
import { listOwnerConnections } from '@/lib/connections/connections-core';
import { mapOwnerConnectionToCard } from '@/lib/connections/map-owner-connection';
import { AppButton, PageHeader } from '@/components/dashboard/ui/dashboard-ui';

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const result = await listOwnerConnections(supabase);

  if (result.error && result.code === 'UNAUTHENTICATED') {
    return (
      <div className="cc-app-page cc-app-page--1040 space-y-6">
        <PageHeader
          title="Connections"
          description="Sign in to see people you have saved."
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
          title="Connections"
          description="We could not load your Connections right now."
          actions={
            <AppButton variant="primary" href="/dashboard/connections">
              Retry
            </AppButton>
          }
        />
        <p className="text-[14px] text-[var(--app-smoke)]" role="alert">
          Please try again in a moment.
        </p>
      </div>
    );
  }

  const cards = result.connections.map(mapOwnerConnectionToCard);

  return <AuthenticatedConnectionsClient initialConnections={cards} />;
}
