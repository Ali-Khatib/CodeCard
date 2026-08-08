import { PublicProfileExperience } from '@/components/profile/public-profile-experience';
import { DEMO_FEATURED_PROJECTS, DEMO_PROFILE } from '@/lib/projects/demo-data';
import { DEMO_RESEARCH_PAPERS } from '@/lib/research/demo-data';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';

export const dynamic = 'force-static';

/** Public-profile demo retired — live demo is the workspace at `/demo`. */
export default function DemoCardPage() {
  return (
    <PublicProfileExperience
      profileSlug="demo"
      displayName={DEMO_PROFILE.display_name}
      headline={DEMO_PROFILE.headline}
      avatarUrl={DEMO_PROFILE.avatar_url}
      bio={DEMO_PROFILE.bio}
      links={links}
      projects={projects}
      researchPapers={DEMO_RESEARCH_PAPERS}
      location={DEMO_PROFILE.location}
    />
  );
}
