import { DashboardResearchView } from '@/components/dashboard/dashboard-research-view';
import { DEMO_RESEARCH_PAPERS } from '@/lib/research/demo-data';
import { DEMO_WORKSPACE } from '@/lib/dashboard/workspace-demo';
import { LIVE_DEMO_WORKSPACE_HREF } from '@/lib/marketing/demo-url';

export const dynamic = 'force-static';

export default function DemoWorkspaceResearchPage() {
  return (
    <DashboardResearchView
      papers={DEMO_RESEARCH_PAPERS.map((paper) => ({ ...paper, isPublished: true }))}
      profileSlug={DEMO_WORKSPACE.profileSlug}
      isProfilePublic
      basePath={LIVE_DEMO_WORKSPACE_HREF}
    />
  );
}
