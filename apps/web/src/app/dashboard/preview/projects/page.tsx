import { DEMO_FEATURED_PROJECTS, DEMO_PROFILE } from '@/lib/projects/demo-data';
import {
  featuredToPortfolioProject,
  profileToPortfolioCreator,
} from '@/lib/dashboard/portfolio';
import { DashboardProjectsPortfolio } from '@/components/dashboard/dashboard-projects-portfolio';
import { DEMO_PROFILE_LINKS, DEMO_WORKSPACE } from '@/lib/dashboard/workspace-demo';

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
).map((p) => featuredToPortfolioProject(p, `/demo/projects/${p.id}`));

export default function PreviewProjectsPage() {
  return (
    <DashboardProjectsPortfolio
      creator={creator}
      projects={projects}
      basePath="/dashboard/preview"
      openTransition={{
        profileSlug: DEMO_WORKSPACE.profileSlug,
        displayName: DEMO_PROFILE.display_name,
        accentColor: DEMO_PROFILE.accentColor,
      }}
    />
  );
}
