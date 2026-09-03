import { redirect } from 'next/navigation';
import { LIVE_DEMO_WORKSPACE_HREF } from '@/lib/marketing/demo-url';

export const dynamic = 'force-static';

export default function DemoWorkspaceResearchPage() {
  redirect(`${LIVE_DEMO_WORKSPACE_HREF}/work#research`);
}
