import { DashboardSettingsView } from '@/components/dashboard/dashboard-settings-view';
import { DEMO_WORKSPACE } from '@/lib/dashboard/workspace-demo';

export default function PreviewSettingsPage() {
  return <DashboardSettingsView email={DEMO_WORKSPACE.email} />;
}
