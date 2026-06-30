import { ProfilesPage } from '@/components/landing/profiles-page';
import { DEMO_FEATURED_PROJECTS, DEMO_PROFILE } from '@/lib/projects/demo-data';

export const metadata = {
  title: 'Profiles | CodeCard',
  description: 'Explore live CodeCard profiles with featured work and project expand transitions.',
};

export default function ProfilesRoute() {
  return (
    <ProfilesPage
      profileSlug="demo"
      displayName={DEMO_PROFILE.display_name}
      headline={DEMO_PROFILE.headline}
      avatarUrl={DEMO_PROFILE.avatar_url}
      bio={DEMO_PROFILE.bio}
      links={DEMO_PROFILE.links}
      projects={DEMO_FEATURED_PROJECTS}
      accentColor={DEMO_PROFILE.accentColor}
    />
  );
}
