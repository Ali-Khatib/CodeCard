import { DashboardSettingsView } from '@/components/dashboard/dashboard-settings-view';
import { DEMO_WORKSPACE } from '@/lib/dashboard/workspace-demo';

export default function PreviewSettingsPage() {
  return (
    <div aria-label="Sample settings">
      <DashboardSettingsView
        email={DEMO_WORKSPACE.email}
        plan="pro"
        profileSlug={DEMO_WORKSPACE.profileSlug}
        isPublic
        accountControls="demo"
      />
    </div>
  );
}
