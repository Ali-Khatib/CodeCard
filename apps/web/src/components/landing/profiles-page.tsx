'use client';

import { useState } from 'react';
import { ProfileLoadingGate } from '@/components/profile/profile-loading-gate';
import { ProfileStrip } from './profile-strip';
import { FeaturedWorkStack } from '@/components/featured-work';
import { useScrollRestore } from '@/hooks/use-scroll-restore';
import type { FeaturedProject } from '@/lib/projects/featured';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import { COLORS } from '@/lib/design/tokens';

interface ProfilesPageProps {
  profileSlug: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  bio: string | null;
  links: ProfileLinkItem[];
  projects: FeaturedProject[];
  accentColor?: string;
}

export function ProfilesPage({
  profileSlug,
  displayName,
  headline,
  avatarUrl,
  links,
  projects,
  accentColor = COLORS.reactor,
}: ProfilesPageProps) {
  useScrollRestore(profileSlug);
  const [activeProjectId, setActiveProjectId] = useState(projects[0]?.id ?? '');

  return (
    <ProfileLoadingGate>
      <div
        className="min-h-[100dvh] text-text-primary"
        style={{ '--profile-accent': accentColor } as React.CSSProperties}
      >
        <ProfileStrip
          displayName={displayName}
          headline={headline}
          avatarUrl={avatarUrl}
          links={links}
        />

        <section id="featured-work" aria-label="Featured work" className="relative cc-container pb-20">
          {projects.length > 0 ? (
            <FeaturedWorkStack
              projects={projects}
              profileSlug={profileSlug}
              displayName={displayName}
              accentColor={accentColor}
              activeId={activeProjectId}
              onActiveChange={setActiveProjectId}
              variant="dark"
              hideHeader
            />
          ) : (
            <p className="py-16 text-center text-graphite">No published projects yet.</p>
          )}
        </section>
      </div>
    </ProfileLoadingGate>
  );
}
