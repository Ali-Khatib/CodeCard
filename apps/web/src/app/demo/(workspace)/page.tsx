import { DashboardOverviewView } from '@/components/dashboard/dashboard-overview-view';
import {
  DEMO_OVERVIEW_ACTIVITY,
  DEMO_PROFILE_LINKS,
  DEMO_SUGGESTED_STEP,
  DEMO_WORKSPACE,
} from '@/lib/dashboard/workspace-demo';
import { greetingForHour } from '@/lib/dashboard/profile-completion';
import { calculateProfileCompletion, deriveProfileCompletionInput } from '@/lib/profile/completion';
import { DEMO_PROFILE } from '@/lib/projects/demo-data';
import { LIVE_DEMO_WORKSPACE_HREF } from '@/lib/marketing/demo-url';
import type { Profile } from '@codecard/types';

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

const basePath = LIVE_DEMO_WORKSPACE_HREF;

export default function DemoWorkspaceOverviewPage() {
  const completion = calculateProfileCompletion(
    deriveProfileCompletionInput(DEMO_PROFILE, {
      hasProfileLink: DEMO_PROFILE_LINKS.length > 0,
      hasPublishedProject: true,
    }),
    { hasAnyProject: true },
  );

  return (
    <DashboardOverviewView
      greeting={greetingForHour()}
      displayName={DEMO_WORKSPACE.displayName}
      completion={completion}
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
            href: `${basePath}/projects`,
          },
          {
            id: 'demo-p2',
            title: 'SchemaSync',
            isPublished: true,
            href: `${basePath}/projects`,
          },
          {
            id: 'demo-p3',
            title: 'Pulse',
            isPublished: false,
            href: `${basePath}/projects`,
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
            href: `${basePath}/research`,
          },
          {
            id: 'demo-r2',
            title: 'Draft paper',
            isPublished: false,
            href: `${basePath}/research`,
          },
        ],
      }}
      activity={DEMO_OVERVIEW_ACTIVITY}
      suggested={{
        ...DEMO_SUGGESTED_STEP,
        href: `${basePath}/projects`,
      }}
      basePath={basePath}
    />
  );
}
