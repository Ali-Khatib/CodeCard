'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProfileLoadingGate } from './profile-loading-gate';
import { ProfileStrip } from '@/components/landing/profile-strip';
import { FeaturedWorkStack } from '@/components/featured-work';
import { useScrollRestore } from '@/hooks/use-scroll-restore';
import { prefetchHref } from '@/hooks/use-view-transition-navigate';
import type { FeaturedProject } from '@/lib/projects/featured';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import { COLORS } from '@/lib/design/tokens';

interface PublicProfileExperienceProps {
  profileSlug: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  bio: string | null;
  links: ProfileLinkItem[];
  projects: FeaturedProject[];
  accentColor?: string;
}

export function PublicProfileExperience({
  profileSlug,
  displayName,
  headline,
  avatarUrl,
  links,
  projects,
  accentColor = COLORS.accent,
}: PublicProfileExperienceProps) {
  useScrollRestore(profileSlug);
  const router = useRouter();
  const [activeProjectId, setActiveProjectId] = useState(projects[0]?.id ?? '');
  const featuredRef = useRef<HTMLElement>(null);

  return (
    <ProfileLoadingGate>
      <div
        className="relative z-[1] min-h-[100dvh] text-text-primary"
        style={{ '--profile-accent': accentColor } as React.CSSProperties}
      >
        <ProfileStrip
          displayName={displayName}
          headline={headline}
          avatarUrl={avatarUrl}
          links={links}
        />

        <section ref={featuredRef} id="featured-work" aria-label="Featured work" className="relative cc-container pb-16">
          {projects.length > 0 ? (
            <FeaturedWorkStack
              projects={projects}
              profileSlug={profileSlug}
              displayName={displayName}
              accentColor={accentColor}
              activeId={activeProjectId}
              onActiveChange={setActiveProjectId}
              hideHeader
            />
          ) : (
            <p className="py-16 text-center text-fog">No published projects yet.</p>
          )}
        </section>

        <footer className="cc-container border-t border-border/30 py-8 text-center">
          <Link
            href="/"
            className="cc-instant-press text-[14px] text-fog transition-colors hover:text-lavender active:opacity-80"
            onMouseEnter={() => prefetchHref('/', router)}
            onFocus={() => prefetchHref('/', router)}
          >
            CodeCard
          </Link>
        </footer>
      </div>
    </ProfileLoadingGate>
  );
}
