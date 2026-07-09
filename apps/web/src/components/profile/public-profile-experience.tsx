'use client';

import { PublicProfileFocused } from './public-profile-focused';
import type { FeaturedProject } from '@/lib/projects/featured';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';

interface PublicProfileExperienceProps {
  profileSlug: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  bio: string | null;
  links: ProfileLinkItem[];
  projects: FeaturedProject[];
  accentColor?: string;
  location?: string | null;
}

export function PublicProfileExperience({
  profileSlug,
  displayName,
  headline,
  avatarUrl,
  bio,
  links,
  projects,
  location,
}: PublicProfileExperienceProps) {
  return (
    <PublicProfileFocused
      profileSlug={profileSlug}
      displayName={displayName}
      headline={headline}
      avatarUrl={avatarUrl}
      bio={bio}
      links={links}
      projects={projects}
      location={location}
    />
  );
}
