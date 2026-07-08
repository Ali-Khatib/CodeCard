import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DEMO_WORKSPACE } from '@/lib/dashboard/workspace-demo';
export default function PreviewDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
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
  );
}
