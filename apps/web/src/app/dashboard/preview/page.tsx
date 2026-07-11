import { DashboardOverviewView } from '@/components/dashboard/dashboard-overview-view';
import {
  DEMO_OVERVIEW_ACTIVITY,
  DEMO_PROFILE_LINKS,
  DEMO_SUGGESTED_STEP,
  DEMO_WORKSPACE,
} from '@/lib/dashboard/workspace-demo';
import { greetingForHour } from '@/lib/dashboard/profile-completion';
import { DEMO_PROFILE } from '@/lib/projects/demo-data';
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

export default function PreviewOverviewPage() {
  return (
    <DashboardOverviewView
      greeting={greetingForHour()}
      displayName={DEMO_WORKSPACE.displayName}
      completion={DEMO_WORKSPACE.completion}
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
        saves: 47,
        qrScans: 128,
      }}
      activity={DEMO_OVERVIEW_ACTIVITY}
      suggested={{
        ...DEMO_SUGGESTED_STEP,
        href: '/dashboard/preview/projects',
      }}
      basePath="/dashboard/preview"
    />
  );
}
