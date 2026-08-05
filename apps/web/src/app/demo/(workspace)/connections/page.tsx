import { DashboardConnectionsView } from '@/components/dashboard/dashboard-connections-view';
import { DEMO_CONNECTIONS } from '@/lib/dashboard/workspace-demo';
import { LIVE_DEMO_WORKSPACE_HREF } from '@/lib/marketing/demo-url';

export default function DemoWorkspaceConnectionsPage() {
  return (
    <DashboardConnectionsView connections={DEMO_CONNECTIONS} basePath={LIVE_DEMO_WORKSPACE_HREF} />
  );
}
