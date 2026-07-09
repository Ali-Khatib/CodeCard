'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProjectMedia } from '@/components/profile/project-media';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import type { FeaturedProject } from '@/lib/projects/featured';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useScrollRestore } from '@/hooks/use-scroll-restore';
import { clearOptimisticProject } from '@/lib/navigation/optimistic-project';
import { MagneticIconButton } from '@/components/profile/magnetic-icon-button';
import { TechLogoRow } from '@/components/profile/tech-logo-row';
import { createSessionId, trackEvent } from '@codecard/analytics';
import { resolveProjectLinkIcon, getProjectLinkAria } from '@/lib/icons/project-links';
import { COLORS, TYPE } from '@/lib/design/tokens';
import { ProjectWorkAtmosphere } from './project-work-atmosphere';
import { isProjectTransitionTarget, useProjectOpenOptional } from './project-open-overlay';

interface ProjectDetailViewProps {
  project: FeaturedProject;
  profileSlug: string;
  profileId?: string;
  displayName: string;
  accentColor?: string;
  /** Rendered by the transition provider during card → project handoff */
  transitionHandoff?: boolean;
}

export function ProjectDetailView({
  project,
  profileSlug,
  profileId,
  displayName,
  accentColor = COLORS.accent,
  transitionHandoff = false,
}: ProjectDetailViewProps) {
  const pathname = usePathname();
  const openCtx = useProjectOpenOptional();
  const reducedMotion = useReducedMotion();
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [fromTransition] = useState(
    () =>
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('cc-project-transition-active'),
  );
  useScrollRestore(profileSlug);

  useEffect(() => {
    if (transitionHandoff) return;
    document.documentElement.classList.remove('cc-project-transition-active');
  }, [transitionHandoff]);

  const screenshots =
    project.screenshots.length > 0
      ? project.screenshots
      : project.posterUrl
        ? [project.posterUrl]
        : [];

  const showVideo = Boolean(project.videoUrl && !reducedMotion && !videoFailed);

  useEffect(() => {
    if (transitionHandoff) return;
    void trackEvent('/api/analytics', {
      event_type: 'project_view',
      project_id: project.id,
      profile_id: profileId,
      session_id: createSessionId(),
      source: 'direct_link',
    });
    clearOptimisticProject();
  }, [project.id, profileId, transitionHandoff]);

  const backHref = profileSlug === 'demo' ? '/demo' : `/${profileSlug}`;

  const hiddenByTransition =
    !transitionHandoff &&
    isProjectTransitionTarget(openCtx?.opening, project.id, pathname);

  if (hiddenByTransition) {
    return null;
  }

  return (
    <div
      className={`relative min-h-[100dvh] text-text-primary ${fromTransition ? 'cc-project-detail-instant' : ''}`}
      style={{ '--profile-accent': accentColor } as React.CSSProperties}
    >
      <ProjectWorkAtmosphere variant="page" />

      <div className="relative z-[1]">
        <header className="cc-container sticky top-0 z-20 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between rounded-full border border-border/40 bg-midnight/75 px-4 py-2.5 shadow-rim">
            <Link
              href={backHref}
              className="cc-instant-press flex items-center gap-2 rounded-full px-2 py-1 text-[15px] text-text-secondary transition-colors hover:text-text-primary active:opacity-80"
              aria-label={`Back to ${displayName}`}
            >
              <HiOutlineArrowLeft className="text-lg" aria-hidden />
              <span className="hidden sm:inline">{displayName}</span>
            </Link>
            <div className="flex gap-2">
              {project.links.map((link) => {
                const Icon = resolveProjectLinkIcon(link.type);
                return (
                  <MagneticIconButton
                    key={link.url + link.type}
                    href={link.url}
                    ariaLabel={getProjectLinkAria(link.type, link.label)}
                    accent={accentColor}
                    size="lg"
                  >
                    <Icon aria-hidden />
                  </MagneticIconButton>
                );
              })}
            </div>
          </div>
        </header>

        <div className="relative w-full overflow-hidden">
          <div className="relative aspect-[16/9] min-h-[min(52vh,520px)] max-h-[min(78vh,880px)] w-full bg-deep-indigo">
            {project.posterUrl && (
              <ProjectMedia
                src={project.posterUrl}
                priority
                className="object-cover object-center"
              />
            )}

            {project.videoUrl && !reducedMotion && (
              <video
                src={project.videoUrl}
                poster={project.posterUrl ?? undefined}
                autoPlay
                muted
                loop
                playsInline
                onError={() => setVideoFailed(true)}
                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ${
                  showVideo ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}

            {!project.posterUrl && !showVideo && (
              <div
                className="absolute inset-0"
                style={{
                  background: `
                    radial-gradient(ellipse 80% 60% at 30% 40%, rgba(147, 130, 255, 0.25), transparent 55%),
                    radial-gradient(ellipse 60% 50% at 75% 65%, rgba(80, 70, 228, 0.2), transparent 50%),
                    linear-gradient(145deg, #10093a 0%, #030014 100%)
                  `,
                }}
              />
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void-canvas via-void-canvas/55 to-void-canvas/10" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-lavender/50 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 cc-container pb-10 pt-28 md:pb-14 md:pt-36">
              <p className={TYPE.eyebrow}>Featured project</p>
              <h1 className={`mt-3 max-w-[14ch] text-balance ${TYPE.projectTitle} text-lilac-white`}>
                {project.title}
              </h1>
              {project.tagline && (
                <p className={`mt-4 max-w-[42ch] ${TYPE.subheading} text-ash`}>{project.tagline}</p>
              )}
              {(project.domains.length > 0 || project.focusAreas.length > 0) && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {[...project.domains, ...project.focusAreas].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-badge border border-lavender/30 bg-midnight/60 px-3 py-1 text-[13px] text-lilac-white backdrop-blur-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <article className="cc-container cc-content pb-24 pt-10 md:pt-14">
          {project.technologies.length > 0 && (
            <section className="rounded-card border border-border/40 bg-midnight/50 p-8 shadow-rim md:p-10">
              <p className={TYPE.eyebrow}>Stack</p>
              <TechLogoRow technologies={project.technologies} isActive pop size="lg" className="mt-5" />
            </section>
          )}

          {project.description && (
            <section className="mt-12 border-t border-border/40 pt-12 md:mt-14 md:pt-14">
              <p className={TYPE.eyebrow}>Overview</p>
              <div className="mt-5 w-full max-w-none space-y-4 font-sans text-[20px] font-normal leading-[1.65] text-ash md:mt-6 md:space-y-5 md:text-[22px] md:leading-[1.6]">
                {project.description
                  .split(/\n\n+/)
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph) => (
                    <p key={paragraph} className="text-pretty">
                      {paragraph}
                    </p>
                  ))}
              </div>
            </section>
          )}

          {screenshots.length > 0 && (
            <section className="mt-16 border-t border-border/40 pt-14 md:mt-20 md:pt-16">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className={TYPE.eyebrow}>Product flow</p>
                  <h2 className="mt-2 font-display text-[32px] font-normal leading-[1.1] tracking-[-0.02em] text-lilac-white md:text-[46px]">
                    Screens &amp; interfaces
                  </h2>
                </div>
                <p className="text-[17px] text-ash md:text-[18px]">
                  {screenshots.length} {screenshots.length === 1 ? 'screen' : 'screens'}
                </p>
              </div>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 md:gap-8">
                {screenshots.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setLightbox(src)}
                    className="group relative aspect-[16/10] overflow-hidden rounded-[14px] border border-border/40 bg-midnight outline-none transition-colors hover:border-lavender/50 focus-visible:ring-2 focus-visible:ring-lavender md:min-h-[280px]"
                  >
                    <ProjectMedia
                      src={src}
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void-canvas/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-void-canvas/95 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close viewer"
            onClick={() => setLightbox(null)}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            className="relative z-10 max-h-[90vh] max-w-full rounded-card object-contain shadow-rim"
          />
        </div>
      )}
    </div>
  );
}
