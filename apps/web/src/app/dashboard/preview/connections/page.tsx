import { DashboardConnectionsView } from '@/components/dashboard/dashboard-connections-view';
import { DEMO_CONNECTIONS } from '@/lib/dashboard/workspace-demo';

export default function PreviewConnectionsPage() {
  return <DashboardConnectionsView connections={DEMO_CONNECTIONS} basePath="/dashboard/preview" />;
}
