import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DEMO_WORKSPACE } from '@/lib/dashboard/workspace-demo';
import { VisitorConversionMarker } from '@/components/visitor-conversion/visitor-conversion-marker';

export default function PreviewDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <VisitorConversionMarker context="live_demo" referrer="dashboard/preview" />
      <DashboardShell
        basePath="/dashboard/preview"
        profileSlug={DEMO_WORKSPACE.profileSlug}
        displayName={DEMO_WORKSPACE.displayName}
        email={DEMO_WORKSPACE.email}
        avatarUrl={DEMO_WORKSPACE.avatarUrl}
        completion={DEMO_WORKSPACE.completion}
        preview
      >
        {children}
      </DashboardShell>
    </>
  );
}
