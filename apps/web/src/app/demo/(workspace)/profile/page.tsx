import { DashboardProfileView } from '@/components/dashboard/dashboard-profile-view';
import { DEMO_PROFILE_LINKS, DEMO_WORKSPACE } from '@/lib/dashboard/workspace-demo';
import { calculateProfileCompletion, deriveProfileCompletionInput } from '@/lib/profile/completion';
import type { ProfileLinkRow } from '@/lib/profile/profile-link-core';
import { DEMO_PROFILE } from '@/lib/projects/demo-data';
import type { Profile, ProfileLinkType } from '@codecard/types';

export const dynamic = 'force-static';

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
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

const demoProfileLinks: ProfileLinkRow[] = DEMO_PROFILE_LINKS.map((link, index) => ({
  id: `demo-link-${index + 1}`,
  type: link.type as ProfileLinkType,
  label: link.label,
  url: link.url,
  sort_order: index,
}));

export default function DemoWorkspaceProfilePage() {
  const completion = calculateProfileCompletion(
    deriveProfileCompletionInput(DEMO_PROFILE, {
      hasProfileLink: DEMO_PROFILE_LINKS.length > 0,
      hasPublishedProject: true,
    }),
    { hasAnyProject: true },
  );

  return (
    <DashboardProfileView
      profile={demoProfile}
      profileLinks={demoProfileLinks}
      completion={completion}
      profileViews={DEMO_WORKSPACE.profileReach}
      links={DEMO_PROFILE_LINKS}
      preview
    />
  );
}
