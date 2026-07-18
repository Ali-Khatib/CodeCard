import { PublicProfileExperience } from '@/components/profile/public-profile-experience';
import { VisitorConversionMarker } from '@/components/visitor-conversion/visitor-conversion-marker';
import { DEMO_PROFILE_LINKS } from '@/lib/dashboard/workspace-demo';
import { DEMO_FEATURED_PROJECTS, DEMO_PROFILE } from '@/lib/projects/demo-data';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';

export const dynamic = 'force-static';

const DEMO_NAMES = ['DevFlow', 'SchemaSync', 'Pulse'] as const;

const projects = DEMO_FEATURED_PROJECTS.filter((p) =>
  DEMO_NAMES.includes(p.title as (typeof DEMO_NAMES)[number]),
);

const links: ProfileLinkItem[] = DEMO_PROFILE.links.map((l) => ({
  type: l.type,
  label: l.label,
  url: l.url,
}));

export default function DemoCardPage() {
  return (
    <>
      <VisitorConversionMarker context="live_demo" referrer="demo/card" />
      <PublicProfileExperience
        profileSlug="demo"
        displayName={DEMO_PROFILE.display_name}
        headline={DEMO_PROFILE.headline}
        avatarUrl={DEMO_PROFILE.avatar_url}
        bio={DEMO_PROFILE.bio}
        links={links.length ? links : DEMO_PROFILE_LINKS}
        projects={projects}
        location={DEMO_PROFILE.location}
      />
    </>
  );
}
