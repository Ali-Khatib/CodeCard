import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DEMO_WORKSPACE } from '@/lib/dashboard/workspace-demo';
import { VisitorConversionMarker } from '@/components/visitor-conversion/visitor-conversion-marker';
import { LIVE_DEMO_WORKSPACE_HREF } from '@/lib/marketing/demo-url';
import { ContentOpeningProvider } from '@/components/navigation/content-opening-transition';
import type { ReactNode } from 'react';

/** Sidebar chrome for the signed-out `/demo` workspace. */
export function DemoWorkspaceFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <VisitorConversionMarker context="live_demo" referrer="demo" />
      <ContentOpeningProvider>
        <DashboardShell
          basePath={LIVE_DEMO_WORKSPACE_HREF}
          profileSlug={DEMO_WORKSPACE.profileSlug}
          displayName={DEMO_WORKSPACE.displayName}
          email={DEMO_WORKSPACE.email}
          avatarUrl={DEMO_WORKSPACE.avatarUrl}
          completion={DEMO_WORKSPACE.completion}
          homeLoopState="share_card"
        >
          {children}
        </DashboardShell>
      </ContentOpeningProvider>
    </>
  );
}
