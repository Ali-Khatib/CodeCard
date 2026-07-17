'use client';

import { PublicProfileFocused } from './public-profile-focused';
import type { FeaturedProject } from '@/lib/projects/featured';
import type { ResearchPaper } from '@/lib/research/research';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';

interface PublicProfileExperienceProps {
  profileSlug: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  bio: string | null;
  links: ProfileLinkItem[];
  projects: FeaturedProject[];
  researchPapers?: ResearchPaper[];
  profileId?: string;
  accentColor?: string;
  location?: string | null;
  connectionControl?: {
    isOwnProfile: boolean;
    isAuthenticated: boolean;
    initiallyConnected: boolean;
    initialConnectionId: string | null;
  } | null;
}

export function PublicProfileExperience({
  profileSlug,
  displayName,
  headline,
  avatarUrl,
  bio,
  links,
  projects,
  researchPapers = [],
  profileId,
  location,
  connectionControl,
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
      researchPapers={researchPapers}
      profileId={profileId}
      location={location}
      connectionControl={connectionControl}
    />
  );
}
