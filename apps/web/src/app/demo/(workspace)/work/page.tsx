import { DEMO_FEATURED_PROJECTS, DEMO_PROFILE } from '@/lib/projects/demo-data';
import {
  featuredToPortfolioProject,
  profileToPortfolioCreator,
} from '@/lib/dashboard/portfolio';
import { DashboardYourWorkView } from '@/components/dashboard/dashboard-your-work-view';
import { DEMO_PROFILE_LINKS, DEMO_WORKSPACE } from '@/lib/dashboard/workspace-demo';
import { DEMO_RESEARCH_PAPERS } from '@/lib/research/demo-data';
import { LIVE_DEMO_WORKSPACE_HREF, publicDemoProjectHref } from '@/lib/marketing/demo-url';

export const dynamic = 'force-static';

const DEMO_NAMES = ['DevFlow', 'SchemaSync', 'Pulse'] as const;

const creator = profileToPortfolioCreator(
  {
    display_name: DEMO_PROFILE.display_name,
    headline: DEMO_PROFILE.headline,
    avatar_url: DEMO_PROFILE.avatar_url,
    slug: DEMO_WORKSPACE.profileSlug,
  },
  DEMO_PROFILE_LINKS,
  {
    location: DEMO_PROFILE.location,
    followers: DEMO_PROFILE.followers,
  },
);

const projects = DEMO_FEATURED_PROJECTS.filter((p) =>
  DEMO_NAMES.includes(p.title as (typeof DEMO_NAMES)[number]),
).map((p) =>
  featuredToPortfolioProject(p, publicDemoProjectHref(DEMO_WORKSPACE.profileSlug, p.id, 'projects')),
);

export default function DemoWorkspaceWorkPage() {
  return (
    <DashboardYourWorkView
      creator={creator}
      projects={projects}
      papers={DEMO_RESEARCH_PAPERS.map((paper) => ({ ...paper, isPublished: true }))}
      profileSlug={DEMO_WORKSPACE.profileSlug}
      isProfilePublic
      basePath={LIVE_DEMO_WORKSPACE_HREF}
      openTransition={{
        profileSlug: DEMO_WORKSPACE.profileSlug,
        displayName: DEMO_PROFILE.display_name,
        accentColor: DEMO_PROFILE.accentColor,
      }}
    />
  );
}
