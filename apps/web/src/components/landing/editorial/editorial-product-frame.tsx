'use client';

import dynamic from 'next/dynamic';
import { DEMO_FEATURED_PROJECTS, DEMO_PROFILE } from '@/lib/projects/demo-data';
import { DEMO_RESEARCH_PAPERS } from '@/lib/research/demo-data';
import {
  DEMO_CONNECTIONS,
  DEMO_OVERVIEW_ACTIVITY,
  DEMO_PROFILE_LINKS,
  DEMO_SUGGESTED_STEP,
  DEMO_WORKSPACE,
} from '@/lib/dashboard/workspace-demo';
import {
  featuredToPortfolioProject,
  profileToPortfolioCreator,
} from '@/lib/dashboard/portfolio';
import {
  LIVE_DEMO_WORKSPACE_HREF,
  publicDemoProjectHref,
} from '@/lib/marketing/demo-url';
import { greetingForHour } from '@/lib/dashboard/profile-completion';
import {
  calculateProfileCompletion,
  deriveProfileCompletionInput,
} from '@/lib/profile/completion';
import type { Profile } from '@codecard/types';
import '@/styles/codecard-app-system.css';

export type EditorialProductState =
  | 'profile'
  | 'projects'
  | 'research'
  | 'circle'
  | 'connections'
  | 'analysis';

/** Demo workspace nav labels — live demo is source of truth. */
const TABS: { id: EditorialProductState; label: string }[] = [
  { id: 'profile', label: 'Home' },
  { id: 'projects', label: 'Projects' },
  { id: 'research', label: 'Research' },
  { id: 'connections', label: 'Connections' },
  { id: 'circle', label: 'Circle' },
  { id: 'analysis', label: 'Analytics' },
];

const DEMO_PROJECT_NAMES = ['DevFlow', 'SchemaSync', 'Pulse'] as const;

const portfolioCreator = profileToPortfolioCreator(
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

const portfolioProjects = DEMO_FEATURED_PROJECTS.filter((p) =>
  DEMO_PROJECT_NAMES.includes(p.title as (typeof DEMO_PROJECT_NAMES)[number]),
).map((p) =>
  featuredToPortfolioProject(
    p,
    publicDemoProjectHref(DEMO_WORKSPACE.profileSlug, p.id),
  ),
);

const publishedPapers = DEMO_RESEARCH_PAPERS.map((paper) => ({
  ...paper,
  isPublished: true,
}));

const demoProfile: Profile = {
  id: 'demo-profile',
  tenant_id: 'demo',
  owner_user_id: 'demo',
  slug: DEMO_WORKSPACE.profileSlug,
  display_name: DEMO_PROFILE.display_name,
  headline: DEMO_PROFILE.headline,
  avatar_url: DEMO_PROFILE.avatar_url,
  bio: DEMO_PROFILE.bio,
  location: DEMO_PROFILE.location,
  skills: [],
  is_public: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const overviewCompletion = calculateProfileCompletion(
  deriveProfileCompletionInput(DEMO_PROFILE, {
    hasProfileLink: DEMO_PROFILE_LINKS.length > 0,
    hasPublishedProject: true,
  }),
  { hasAnyProject: true },
);

const DashboardConnectionsView = dynamic(
  () =>
    import('@/components/dashboard/dashboard-connections-view').then(
      (m) => m.DashboardConnectionsView,
    ),
  { ssr: true },
);

const DashboardProjectsPortfolio = dynamic(
  () =>
    import('@/components/dashboard/dashboard-projects-portfolio').then(
      (m) => m.DashboardProjectsPortfolio,
    ),
  { ssr: true },
);

const DashboardResearchView = dynamic(
  () =>
    import('@/components/dashboard/dashboard-research-view').then(
      (m) => m.DashboardResearchView,
    ),
  { ssr: true },
);

const DashboardCircleView = dynamic(
  () =>
    import('@/components/dashboard/dashboard-circle-view').then(
      (m) => m.DashboardCircleView,
    ),
  { ssr: true },
);

const PreviewAnalyticsView = dynamic(
  () =>
    import('@/components/dashboard/preview-analytics-view').then(
      (m) => m.PreviewAnalyticsView,
    ),
  { ssr: true },
);

const DashboardOverviewView = dynamic(
  () =>
    import('@/components/dashboard/dashboard-overview-view').then(
      (m) => m.DashboardOverviewView,
    ),
  { ssr: true },
);

/**
 * Landing product frame = live demo UI (same components + styles),
 * clipped as a non-interactive snapshot so marketing stays in sync.
 */
export function EditorialProductFrame({
  state = 'profile',
  className = '',
  size = 'default',
}: {
  state?: EditorialProductState;
  className?: string;
  size?: 'default' | 'lg';
}) {
  return (
    <article
      className={`cc-ed__frame cc-ed__frame--demo ${size === 'lg' ? 'cc-ed__frame--lg' : ''} ${className}`.trim()}
      data-testid="editorial-product-frame"
      data-state={state}
    >
      <header className="cc-ed__demo-chrome" aria-hidden>
        <p className="cc-ed__demo-chrome-title">
          {TABS.find((t) => t.id === state)?.label ?? 'CodeCard'}
        </p>
        <nav className="cc-ed__frame-tabs" aria-hidden>
          {TABS.map((tab) => (
            <span
              key={tab.id}
              className="cc-ed__frame-tab"
              data-active={tab.id === state ? 'true' : undefined}
            >
              {tab.label}
            </span>
          ))}
        </nav>
      </header>

      <div className="cc-app-root cc-ed__demo-snap" aria-hidden>
        <div className="cc-ed__demo-snap__inner">
          {state === 'profile' ? (
            <DashboardOverviewView
              greeting={greetingForHour()}
              displayName={DEMO_WORKSPACE.displayName}
              completion={overviewCompletion}
              profileSlug={DEMO_WORKSPACE.profileSlug}
              avatarUrl={DEMO_WORKSPACE.avatarUrl}
              headline={DEMO_PROFILE.headline}
              bio={DEMO_PROFILE.bio}
              profileViews={DEMO_WORKSPACE.profileReach}
              links={DEMO_PROFILE_LINKS}
              profile={demoProfile}
              preview
              stats={{
                profileViews: 1284,
                projectOpens: 342,
                linkClicks: 47,
                qrDownloads: 128,
              }}
              projectsSummary={{
                total: 3,
                published: 2,
                recent: [
                  {
                    id: 'demo-p1',
                    title: 'DevFlow',
                    isPublished: true,
                    href: `${LIVE_DEMO_WORKSPACE_HREF}/projects`,
                  },
                  {
                    id: 'demo-p2',
                    title: 'SchemaSync',
                    isPublished: true,
                    href: `${LIVE_DEMO_WORKSPACE_HREF}/projects`,
                  },
                  {
                    id: 'demo-p3',
                    title: 'Pulse',
                    isPublished: false,
                    href: `${LIVE_DEMO_WORKSPACE_HREF}/projects`,
                  },
                ],
              }}
              researchSummary={{
                total: 2,
                published: 1,
                recent: [
                  {
                    id: 'demo-r1',
                    title: 'Sample research paper',
                    isPublished: true,
                    href: `${LIVE_DEMO_WORKSPACE_HREF}/research`,
                  },
                  {
                    id: 'demo-r2',
                    title: 'Draft paper',
                    isPublished: false,
                    href: `${LIVE_DEMO_WORKSPACE_HREF}/research`,
                  },
                ],
              }}
              activity={DEMO_OVERVIEW_ACTIVITY}
              suggested={{
                ...DEMO_SUGGESTED_STEP,
                href: `${LIVE_DEMO_WORKSPACE_HREF}/projects`,
              }}
              basePath={LIVE_DEMO_WORKSPACE_HREF}
            />
          ) : null}
          {state === 'projects' ? (
            <DashboardProjectsPortfolio
              creator={portfolioCreator}
              projects={portfolioProjects}
              basePath={LIVE_DEMO_WORKSPACE_HREF}
            />
          ) : null}
          {state === 'research' ? (
            <DashboardResearchView
              papers={publishedPapers}
              profileSlug={DEMO_WORKSPACE.profileSlug}
              isProfilePublic
              basePath={LIVE_DEMO_WORKSPACE_HREF}
            />
          ) : null}
          {state === 'circle' ? <DashboardCircleView /> : null}
          {state === 'connections' ? (
            <DashboardConnectionsView
              connections={DEMO_CONNECTIONS}
              basePath={LIVE_DEMO_WORKSPACE_HREF}
            />
          ) : null}
          {state === 'analysis' ? (
            <PreviewAnalyticsView displayName={DEMO_PROFILE.display_name} />
          ) : null}
        </div>
      </div>
    </article>
  );
}
