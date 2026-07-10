'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRef } from 'react';
import type { FeaturedProject } from '@/lib/projects/featured';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import { COLORS, LAYOUT, MAGIC_BENTO } from '@/lib/design/tokens';
import { getProfileLinkAria, resolveProfileLinkIcon } from '@/lib/icons/profile-links';
import { useViewTransitionNavigate } from '@/hooks/use-view-transition-navigate';
import { saveScrollForProfile } from '@/hooks/use-scroll-restore';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const GlobalSpotlight = dynamic(
  () =>
    import('@/components/react-bits/magic-bento/magic-bento').then((m) => ({
      default: m.GlobalSpotlight,
    })),
  { ssr: false },
);

interface ProfileMagicBentoProps {
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  bio: string | null;
  links: ProfileLinkItem[];
  featuredProject?: FeaturedProject;
  projectCount: number;
  profileSlug: string;
  accentColor?: string;
  simplified?: boolean;
}

export function ProfileMagicBento({
  displayName,
  headline,
  avatarUrl,
  bio,
  links,
  featuredProject,
  projectCount,
  profileSlug,
  accentColor = COLORS.accent,
  simplified = false,
}: ProfileMagicBentoProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const navigate = useViewTransitionNavigate();

  const openProject = () => {
    if (!featuredProject) return;
    saveScrollForProfile(profileSlug);
    const base = profileSlug === 'demo' ? '/demo' : `/${profileSlug}`;
    navigate(`${base}/projects/${featuredProject.id}`);
  };

  const tileClass =
    'bento-tile bento-tile--glow relative overflow-hidden rounded-card border border-border bg-[rgba(25,27,31,0.72)]';

  const Tile = ({ className, children }: { className: string; children: React.ReactNode }) => (
    <div className={className}>{children}</div>
  );

  return (
    <section
      className="cc-content py-8 md:py-10"
      style={{ '--profile-accent': accentColor } as React.CSSProperties}
      aria-label="Profile identity"
    >
      <style>{`
        .profile-bento-grid .bento-tile {
          --glow-x: 50%;
          --glow-y: 50%;
          --glow-intensity: 0;
          --glow-radius: ${MAGIC_BENTO.spotlightRadius}px;
        }
        .profile-bento-grid .bento-tile--glow::after {
          content: '';
          position: absolute;
          inset: 0;
          padding: 1px;
          background: radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y),
            rgba(${MAGIC_BENTO.glowColor}, calc(var(--glow-intensity) * 0.85)) 0%,
            rgba(${MAGIC_BENTO.glowColor}, calc(var(--glow-intensity) * 0.35)) 35%,
            transparent 62%);
          border-radius: inherit;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          pointer-events: none;
          z-index: 2;
        }
        @media (min-width: 1024px) {
          .profile-bento-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            grid-template-rows: minmax(220px, 1fr) minmax(200px, 1fr);
            gap: 12px;
            min-height: 520px;
            max-height: 620px;
            max-width: ${LAYOUT.contentMax}px;
            margin-inline: auto;
          }
          .profile-bento-identity { grid-column: 1 / span 8; grid-row: 1 / span 2; }
          .profile-bento-project { grid-column: 9 / span 4; grid-row: 1 / span 1; }
          .profile-bento-meta { grid-column: 9 / span 4; grid-row: 2 / span 1; }
        }
        @media (max-width: 1023px) {
          .profile-bento-grid { display: flex; flex-direction: column; gap: 12px; }
        }
      `}</style>

      {!reducedMotion && MAGIC_BENTO.enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={reducedMotion}
          enabled={MAGIC_BENTO.enableSpotlight}
          spotlightRadius={MAGIC_BENTO.spotlightRadius}
          glowColor={MAGIC_BENTO.glowColor}
        />
      )}

      <div ref={gridRef} className="profile-bento-grid bento-section select-none">
        <Tile className={`profile-bento-identity ${tileClass} p-7 md:p-8 lg:p-9`}>
          <div className="relative z-[3] flex h-full flex-col justify-between gap-6">
            <div className="flex items-start gap-5 md:gap-6">
              <div className="h-[112px] w-[112px] shrink-0 overflow-hidden rounded-[12px] border border-border md:h-[128px] md:w-[128px] lg:h-[144px] lg:w-[144px]">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-canvas text-4xl font-bold">
                    {displayName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 rounded-badge border border-lavender/40 bg-lavender/10 px-3 py-1 text-[13px] font-medium text-lavender">
                  <span className="h-1.5 w-1.5 rounded-full bg-lavender shadow-[0_0_8px_rgba(147,130,255,0.6)]" />
                  Available
                </span>
                <h1 className="mt-4 font-display text-[40px] font-normal leading-[1.05] tracking-[-0.03em] md:text-[56px] lg:text-[72px]">
                  {displayName}
                </h1>
                {headline && (
                  <p className="mt-2 text-[20px] text-text-secondary md:text-[24px]">{headline}</p>
                )}
                {bio && !simplified && (
                  <p className="mt-3 max-w-[520px] text-[17px] leading-relaxed text-text-secondary">
                    {bio}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {links.map((link) => {
                  const Icon = resolveProfileLinkIcon(link.type);
                  return (
                    <Link
                      key={link.url + link.type}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={getProfileLinkAria(link.type, link.label)}
                      className="flex h-11 w-11 items-center justify-center rounded-btn border border-border bg-midnight/80 text-text-primary transition-colors hover:border-lavender/50"
                    >
                      <Icon className="text-2xl" aria-hidden />
                    </Link>
                  );
                })}
              </div>
              <p className="text-[15px] text-text-secondary">
                <span className="font-semibold text-text-primary">{projectCount}</span> featured projects
              </p>
            </div>
          </div>
        </Tile>

        {featuredProject && (
          <Tile className={`profile-bento-project ${tileClass} p-7 md:p-8`}>
            <button
              type="button"
              onClick={openProject}
              className="relative z-[3] flex h-full w-full cursor-pointer flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-lavender"
            >
              <p className="cc-tag-dot font-mono text-[13px] uppercase tracking-[-0.02em] text-graphite">
                Featured project
              </p>
              {featuredProject.posterUrl && (
                <div className="mt-3 flex-1 overflow-hidden rounded-[12px] border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredProject.posterUrl}
                    alt=""
                    className="h-full min-h-[120px] w-full object-cover object-top"
                  />
                </div>
              )}
              <h2 className="mt-3 font-display text-[22px] leading-snug">{featuredProject.title}</h2>
              <p className="mt-1 text-[15px] text-text-secondary">{featuredProject.tagline}</p>
            </button>
          </Tile>
        )}

        <Tile className={`profile-bento-meta ${tileClass} p-7 md:p-8`}>
          <div className="relative z-[3] flex h-full flex-col justify-between">
            <div>
              <p className="font-mono text-[13px] uppercase tracking-[-0.02em] text-graphite">Connect</p>
              <p className="mt-3 font-display text-[20px] leading-snug">
                Save this profile after you meet. Add context only you see.
              </p>
            </div>
            <p className="text-[15px] text-text-secondary">
              {links.find((l) => l.type === 'github') ? 'Active on GitHub' : 'Open to collaboration'}
            </p>
          </div>
        </Tile>
      </div>
    </section>
  );
}
