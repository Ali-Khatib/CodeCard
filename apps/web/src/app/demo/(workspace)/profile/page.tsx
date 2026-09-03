import { WorkspaceHashRedirect } from '@/components/dashboard/workspace-hash-redirect';
import { LIVE_DEMO_WORKSPACE_HREF } from '@/lib/marketing/demo-url';

export const dynamic = 'force-static';

export default function DemoWorkspaceProfilePage() {
  return <WorkspaceHashRedirect to={LIVE_DEMO_WORKSPACE_HREF} />;
}
