'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DEMO_FEATURED_PROJECTS, DEMO_PROFILE, DEMO_RESUME_URL } from '@/lib/projects/demo-data';
import { DEMO_RESEARCH_PAPERS } from '@/lib/research/demo-data';
import type { GuideShotId } from '@/lib/marketing/guide-content';
import {
  DEMO_CONNECTIONS,
  DEMO_OWNER_EVENTS,
  DEMO_PROFILE_LINKS,
  DEMO_WORKSPACE,
  getDemoHomeSuggestedStep,
  getDemoProfileCompletion,
} from '@/lib/dashboard/workspace-demo';
import { followUpsToHomeItems } from '@/lib/dashboard/connections-summary';
import { DEMO_CIRCLE_FEED } from '@/lib/dashboard/circle-demo';
import { overviewCircleWorksFromDemoFeed } from '@/lib/dashboard/overview-circle-works';
import {
  featuredToPortfolioProject,
  profileToPortfolioCreator,
} from '@/lib/dashboard/portfolio';
import {
  LIVE_DEMO_WORKSPACE_HREF,
  publicDemoProjectHref,
} from '@/lib/marketing/demo-url';
import { greetingForHour } from '@/lib/dashboard/profile-completion';
import { MutationFeedbackProvider } from '@/components/dashboard/mutation-feedback-provider';
import type { Profile } from '@codecard/types';
import '@/styles/codecard-app-system.css';

export type EditorialProductState =
  | 'profile'
  | 'projects'
  | 'research'
  | 'circle'
  | 'connections'
  | 'analysis'
  | 'settings';

/** Demo workspace nav labels — live demo is source of truth. */
const TABS: { id: EditorialProductState; label: string }[] = [
  { id: 'profile', label: 'Home' },
  { id: 'projects', label: 'Projects' },
  { id: 'research', label: 'Research' },
  { id: 'connections', label: 'Connections' },
  { id: 'circle', label: 'Circle' },
  { id: 'analysis', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
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
  skills: DEMO_PROFILE.skills,
  is_public: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const overviewCompletion = getDemoProfileCompletion(LIVE_DEMO_WORKSPACE_HREF);

const DashboardConnectionsView = dynamic(
  () =>
    import('@/components/dashboard/dashboard-connections-view').then(
      (m) => m.DashboardConnectionsView,
    ),
  { ssr: true },
);

const DashboardYourWorkView = dynamic(
  () =>
    import('@/components/dashboard/dashboard-your-work-view').then(
      (m) => m.DashboardYourWorkView,
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

const DashboardSettingsView = dynamic(
  () =>
    import('@/components/dashboard/dashboard-settings-view').then(
      (m) => m.DashboardSettingsView,
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

const ProjectDetailView = dynamic(
  () =>
    import('@/components/featured-work/project-detail-view').then(
      (m) => m.ProjectDetailView,
    ),
  { ssr: true },
);

function tabForShot(shot: GuideShotId | undefined, state: EditorialProductState): EditorialProductState {
  if (!shot) return state;
  if (shot.startsWith('home-')) return 'profile';
  if (shot === 'work-research') return 'research';
  if (shot.startsWith('work-')) return 'projects';
  if (shot.startsWith('connections-')) return 'connections';
  if (shot.startsWith('circle-')) return 'circle';
  if (shot.startsWith('analytics-')) return 'analysis';
  if (shot.startsWith('settings-')) return 'settings';
  return state;
}

/**
 * Landing product frame = live demo UI (same components + styles),
 * clipped as a non-interactive snapshot so marketing stays in sync.
 */
export function EditorialProductFrame({
  state = 'profile',
  shot,
  className = '',
  size = 'default',
  fit = 'clip',
}: {
  state?: EditorialProductState;
  shot?: GuideShotId;
  className?: string;
  size?: 'default' | 'lg';
  fit?: 'clip' | 'content';
}) {
  const tab = tabForShot(shot, state);
  return (
    <article
      className={`cc-ed__frame cc-ed__frame--demo ${size === 'lg' ? 'cc-ed__frame--lg' : ''} ${fit === 'content' ? 'cc-ed__frame--fit' : ''} ${className}`.trim()}
      data-testid="editorial-product-frame"
      data-state={tab}
      data-shot={shot}
    >
      <header className="cc-ed__demo-chrome" aria-hidden>
        <p className="cc-ed__demo-chrome-title">
          {TABS.find((t) => t.id === tab)?.label ?? 'CodeCard'}
        </p>
        <nav className="cc-ed__frame-tabs" aria-hidden>
          {TABS.map((item) => (
            <span
              key={item.id}
              className="cc-ed__frame-tab"
              data-active={item.id === tab ? 'true' : undefined}
            >
              {item.label}
            </span>
          ))}
        </nav>
      </header>

      <div className="cc-app-root cc-ed__demo-snap" aria-hidden>
        <MutationFeedbackProvider>
        <div className="cc-ed__demo-snap__inner">
          {(shot ?? (state === 'profile' ? 'home-desk' : undefined))?.startsWith('home-') ||
          (!shot && state === 'profile') ? (
            <DashboardOverviewView
              guideFocus={
                shot === 'home-share'
                  ? 'share'
                  : shot === 'home-identity'
                    ? 'identity'
                    : shot === 'home-calendar'
                      ? 'calendar'
                      : shot === 'home-work'
                        ? 'work'
                        : shot === 'home-reach'
                          ? 'reach'
                          : shot === 'home-circle'
                            ? 'circle'
                            : shot === 'home-desk'
                              ? 'desk'
                              : undefined
              }
              hasAnyProject
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
              circleWorks={overviewCircleWorksFromDemoFeed(DEMO_CIRCLE_FEED, 3)}
              suggested={getDemoHomeSuggestedStep(LIVE_DEMO_WORKSPACE_HREF)}
              basePath={LIVE_DEMO_WORKSPACE_HREF}
              events={DEMO_OWNER_EVENTS}
              followUps={followUpsToHomeItems(DEMO_CONNECTIONS)}
            />
          ) : null}
          {shot === 'work-projects' ||
          shot === 'work-research' ||
          (!shot && (tab === 'projects' || tab === 'research')) ? (
            <DashboardYourWorkView
              creator={portfolioCreator}
              projects={portfolioProjects}
              papers={publishedPapers}
              profileSlug={DEMO_WORKSPACE.profileSlug}
              isProfilePublic
              basePath={LIVE_DEMO_WORKSPACE_HREF}
              guideFocus={
                shot === 'work-research' || (!shot && tab === 'research')
                  ? 'research'
                  : 'projects'
              }
            />
          ) : null}
          {shot === 'work-project' && DEMO_FEATURED_PROJECTS[0] ? (
            <Suspense fallback={<p className="p-6 text-sm">Opening the project…</p>}>
              <ProjectDetailView
                project={DEMO_FEATURED_PROJECTS[0]}
                profileSlug={DEMO_WORKSPACE.profileSlug}
                displayName={DEMO_PROFILE.display_name}
                projects={DEMO_FEATURED_PROJECTS}
                resumeUrl={DEMO_RESUME_URL}
                backHref={`${LIVE_DEMO_WORKSPACE_HREF}/work`}
                backLabel="Your Work"
              />
            </Suspense>
          ) : null}
          {tab === 'circle' ? <DashboardCircleView /> : null}
          {tab === 'connections' ? (
            <DashboardConnectionsView
              connections={DEMO_CONNECTIONS}
              basePath={LIVE_DEMO_WORKSPACE_HREF}
              initialSelectedId={shot === 'connections-open' ? 'c1' : null}
            />
          ) : null}
          {tab === 'analysis' ? (
            <PreviewAnalyticsView
              displayName={DEMO_PROFILE.display_name}
              guideFocus={
                shot === 'analytics-review'
                  ? 'review'
                  : shot === 'analytics-reach'
                    ? 'reach'
                    : shot === 'analytics-projects'
                      ? 'projects'
                      : shot === 'analytics-research'
                        ? 'research'
                        : shot === 'analytics-audience'
                          ? 'audience'
                          : undefined
              }
            />
          ) : null}
          {tab === 'settings' ? (
            <DashboardSettingsView
              email={DEMO_WORKSPACE.email}
              plan="pro"
              profileSlug={DEMO_WORKSPACE.profileSlug}
              isPublic
              accountControls="demo"
              initialSection={
                shot === 'settings-signin'
                  ? 'account'
                  : shot === 'settings-plan'
                    ? 'billing'
                    : shot === 'settings-export'
                      ? 'danger'
                      : 'profile'
              }
            />
          ) : null}
        </div>
        </MutationFeedbackProvider>
      </div>
    </article>
  );
}
