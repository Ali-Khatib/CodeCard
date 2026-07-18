'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProjectMedia } from '@/components/profile/project-media';
import { HiOutlineArrowLeft, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';
import type { FeaturedProject } from '@/lib/projects/featured';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useScrollRestore } from '@/hooks/use-scroll-restore';
import { clearOptimisticProject } from '@/lib/navigation/optimistic-project';
import {
  buildPublicProjectDetailHref,
  getAdjacentProjects,
} from '@/lib/projects/project-navigation';
import { TechLogoRow } from '@/components/profile/tech-logo-row';
import { createSessionId, trackEvent } from '@codecard/analytics';
import { COLORS, TYPE } from '@/lib/design/tokens';
import { ProjectWorkAtmosphere } from './project-work-atmosphere';
import { isProjectTransitionTarget, useProjectOpenOptional } from './project-open-overlay';
import { ProjectCaseStudyTabs } from './project-case-study-tabs';
import { hasShowcaseExtras } from '@/lib/projects/case-study-sections';
import { trackProjectEngagementEvent, canTrackId } from '@/components/research/research-analytics';
import { useActiveTimeTracking } from '@/hooks/use-active-time-tracking';
import { PublicReportDialog } from '@/components/moderation/public-report-dialog';
import { MAIN_CONTENT_ID } from '@/lib/a11y/main-content';

const PROJECT_NAV_BTN = 'cc-project-nav-btn cc-instant-press group';

interface ProjectDetailViewProps {
  project: FeaturedProject;
  profileSlug: string;
  profileId?: string;
  displayName: string;
  accentColor?: string;
  projects?: FeaturedProject[];
  /** Rendered by the transition provider during card → project handoff */
  transitionHandoff?: boolean;
}

export function ProjectDetailView({
  project,
  profileSlug,
  profileId,
  displayName,
  accentColor = COLORS.accent,
  projects,
  transitionHandoff = false,
}: ProjectDetailViewProps) {
  const pathname = usePathname();
  const openCtx = useProjectOpenOptional();
  const reducedMotion = useReducedMotion();
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const viewedSections = useRef<Set<string>>(new Set());
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

  useActiveTimeTracking({
    enabled: !transitionHandoff && canTrackId(profileId) && canTrackId(project.id),
    targetKey: `project:${project.id}`,
    onFlush: (seconds) => {
      trackProjectEngagementEvent({
        eventType: 'project_time_spent',
        profileId,
        projectId: project.id,
        metadata: { seconds },
      });
    },
  });

  const trackProjectSection = useCallback(
    (sectionName: string, eventType: 'project_section_view' | 'project_section_hover_or_click' = 'project_section_view') => {
      if (eventType === 'project_section_view') {
        if (viewedSections.current.has(sectionName)) return;
        viewedSections.current.add(sectionName);
      }
      trackProjectEngagementEvent({
        eventType,
        profileId,
        projectId: project.id,
        sectionName,
      });
    },
    [profileId, project.id],
  );

  useEffect(() => {
    if (transitionHandoff) return;
    if (project.technologies.length > 0) trackProjectSection('Tech Stack');
    if (project.description) trackProjectSection('Overview');
    if (screenshots.length > 0) trackProjectSection('Product flow');
  }, [
    project.description,
    project.technologies.length,
    screenshots.length,
    trackProjectSection,
    transitionHandoff,
  ]);

  const backHref = profileSlug === 'demo' ? '/demo' : `/${profileSlug}`;
  const projectList = projects?.length ? projects : [project];
  const { previous: previousProject, next: nextProject } = getAdjacentProjects(
    projectList,
    project.id,
  );
  const showcaseExtras = hasShowcaseExtras(project);

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

      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="relative z-[1]">
        <header className="cc-container sticky top-0 z-20 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 rounded-full border border-border/40 bg-midnight/75 px-3 py-2.5 shadow-rim sm:px-4">
            <Link
              href={backHref}
              className="cc-instant-press flex items-center gap-2 rounded-full px-2 py-1 text-[15px] text-text-secondary transition-colors hover:text-text-primary active:opacity-80"
              aria-label={`Back to ${displayName}`}
            >
              <HiOutlineArrowLeft className="text-lg" aria-hidden />
              <span className="hidden sm:inline">{displayName}</span>
            </Link>
            {profileId && profileSlug !== 'demo' ? (
              <PublicReportDialog targetType="project" targetId={project.id} />
            ) : null}
          </div>
        </header>

        {(previousProject || nextProject) && (
          <nav className="pointer-events-none fixed inset-x-0 top-1/2 z-30 hidden -translate-y-1/2 justify-between px-4 md:flex lg:px-8" aria-label="Project navigation">
            {previousProject ? (
              <Link
                href={buildPublicProjectDetailHref(profileSlug, previousProject.id)}
                className={PROJECT_NAV_BTN}
                aria-label={`Previous project: ${previousProject.title}`}
                title={previousProject.title}
              >
                <HiOutlineChevronLeft className="transition-transform group-hover:-translate-x-0.5" aria-hidden />
              </Link>
            ) : (
              <span />
            )}
            {nextProject ? (
              <Link
                href={buildPublicProjectDetailHref(profileSlug, nextProject.id)}
                className={PROJECT_NAV_BTN}
                aria-label={`Next project: ${nextProject.title}`}
                title={nextProject.title}
              >
                <HiOutlineChevronRight className="transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}

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

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(5,3,15,0.9)_0%,rgba(5,3,15,0.62)_40%,rgba(5,3,15,0.28)_72%,rgba(5,3,15,0.1)_100%),linear-gradient(90deg,rgba(5,3,15,0.68)_0%,rgba(5,3,15,0.34)_42%,rgba(5,3,15,0.1)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-lavender/50 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 cc-container pb-10 pt-28 md:pb-14 md:pt-36">
              <div className="max-w-[680px] rounded-[26px] border border-white/22 bg-black/48 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.42)] backdrop-blur-md md:p-6">
                <p className="font-eyebrow text-[11px] font-semibold uppercase tracking-[0.08em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
                  Featured project
                </p>
                <h1 className="cc-fit-title mt-3 max-w-full break-words font-display text-[clamp(1.75rem,8vw,3.4rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.72)] md:max-w-[14ch]">
                  {project.title}
                </h1>
                {project.tagline && (
                  <p className="mt-4 max-w-[42ch] break-words text-[17px] font-semibold leading-snug text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.62)] md:text-[18px]">
                    {project.tagline}
                  </p>
                )}
                {(project.domains.length > 0 || project.focusAreas.length > 0) && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {[...project.domains, ...project.focusAreas].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/40 bg-black/55 px-3 py-1.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <article
          className={`cc-container cc-content cc-on-cream-surface pb-24 ${showcaseExtras ? 'pt-10 md:pt-14' : 'pt-4 md:pt-6'}`}
        >
          {(previousProject || nextProject) && (
            <nav className="mb-8 grid grid-cols-2 gap-3 md:hidden" aria-label="Project navigation">
              {previousProject ? (
                <Link
                  href={buildPublicProjectDetailHref(profileSlug, previousProject.id)}
                  className="cc-instant-press rounded-full border border-[var(--app-ink)]/14 bg-[var(--app-paper)] px-4 py-3 text-center text-[14px] font-semibold text-[var(--app-ink)] shadow-[0_8px_20px_rgba(34,34,34,0.06)]"
                  aria-label={`Previous project: ${previousProject.title}`}
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}
              {nextProject ? (
                <Link
                  href={buildPublicProjectDetailHref(profileSlug, nextProject.id)}
                  className="cc-instant-press rounded-full border border-[var(--app-ink)]/14 bg-[var(--app-paper)] px-4 py-3 text-center text-[14px] font-semibold text-[var(--app-ink)] shadow-[0_8px_20px_rgba(34,34,34,0.06)]"
                  aria-label={`Next project: ${nextProject.title}`}
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}

          <ProjectCaseStudyTabs
            project={project}
            onSectionInteract={(sectionName) =>
              trackProjectSection(sectionName, 'project_section_hover_or_click')
            }
          />

          {project.technologies.length > 0 && (
            <section
              className="rounded-card border border-border/40 bg-midnight/50 p-8 shadow-rim md:p-10"
              onMouseEnter={() => trackProjectSection('Tech Stack', 'project_section_hover_or_click')}
              onFocus={() => trackProjectSection('Tech Stack', 'project_section_hover_or_click')}
            >
              <p className={TYPE.eyebrow}>Stack</p>
              <TechLogoRow technologies={project.technologies} isActive pop size="lg" className="mt-5" />
            </section>
          )}

          {project.description && (
            <section
              className="mt-12 border-t border-border/40 pt-12 md:mt-14 md:pt-14"
              onMouseEnter={() => trackProjectSection('Overview', 'project_section_hover_or_click')}
              onFocus={() => trackProjectSection('Overview', 'project_section_hover_or_click')}
            >
              <p className={TYPE.eyebrow}>Overview</p>
              <div className="mt-5 w-full max-w-none space-y-4 font-sans text-[20px] font-normal leading-[1.65] text-ash md:mt-6 md:space-y-5 md:text-[22px] md:leading-[1.6]">
                {project.description
                  .split(/\n\n+/)
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph) => (
                    <p key={paragraph} className="break-words text-pretty">
                      {paragraph}
                    </p>
                  ))}
              </div>
            </section>
          )}

          {screenshots.length > 0 && (
            <section
              className="mt-16 border-t border-border/40 pt-14 md:mt-20 md:pt-16"
              onMouseEnter={() => trackProjectSection('Product flow', 'project_section_hover_or_click')}
              onFocus={() => trackProjectSection('Product flow', 'project_section_hover_or_click')}
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className={TYPE.eyebrow}>Product flow</p>
                  <h2 className={TYPE.contentSectionTitle}>
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
                    onClick={() => {
                      trackProjectSection('Product flow', 'project_section_hover_or_click');
                      setLightbox(src);
                    }}
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
      </main>

      {lightbox && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-void-canvas/95 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Project image viewer"
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
