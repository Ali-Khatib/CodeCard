import { DashboardResearchView } from '@/components/dashboard/dashboard-research-view';
import { DEMO_RESEARCH_PAPERS } from '@/lib/research/demo-data';
import { DEMO_WORKSPACE } from '@/lib/dashboard/workspace-demo';

export const dynamic = 'force-static';

export default function PreviewResearchPage() {
  return (
    <DashboardResearchView
      papers={DEMO_RESEARCH_PAPERS}
      profileSlug={DEMO_WORKSPACE.profileSlug}
    />
  );
}
