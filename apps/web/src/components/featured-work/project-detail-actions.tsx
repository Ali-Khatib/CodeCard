'use client';

import { FaGithub } from 'react-icons/fa6';
import { HiOutlineArrowDownTray, HiOutlinePlay } from 'react-icons/hi2';
import { firstSafeProjectLink } from '@/lib/projects/safe-project-link-url';
import { isAllowedProfileLinkHref } from '@codecard/validation';
import type { FeaturedProject } from '@/lib/projects/featured';
import { trackLinkClick } from '@/lib/analytics/link-click';

type Variant = 'hero' | 'panel';

/**
 * Project outbound actions — GitHub / live demo / resume — with link_click tracking.
 * Hero sits on the cinematic card; panel sits in the article for after-scroll reach.
 */
export function ProjectDetailActions({
  project,
  profileId,
  resumeUrl,
  variant = 'hero',
}: {
  project: FeaturedProject;
  profileId?: string;
  resumeUrl?: string | null;
  variant?: Variant;
}) {
  const liveLink = firstSafeProjectLink(project.links, ['live', 'demo']);
  const repoLink = firstSafeProjectLink(project.links, ['repo', 'github']);
  const resumeCandidate = resumeUrl?.trim() || null;
  const resume =
    resumeCandidate && isAllowedProfileLinkHref(resumeCandidate) ? resumeCandidate : null;

  if (!liveLink && !repoLink && !resume) return null;

  const isHero = variant === 'hero';

  const btnBase = isHero
    ? 'cc-instant-press inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold tracking-[-0.01em] transition-[transform,background-color,border-color,color] duration-200 active:scale-[0.98] sm:text-[14px]'
    : 'cc-instant-press inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold tracking-[-0.01em] transition-[transform,background-color,border-color] duration-200 active:scale-[0.98] sm:text-[14px]';

  const primary = isHero
    ? `${btnBase} border border-white/90 bg-white text-[#141316] shadow-[0_10px_28px_rgba(0,0,0,0.28)] hover:bg-[#f5f2ee]`
    : `${btnBase} border border-[var(--app-ink)] bg-[var(--app-ink)] text-[var(--app-paper)] hover:opacity-92`;

  const ghost = isHero
    ? `${btnBase} border border-white/45 bg-white/10 text-white backdrop-blur-sm hover:border-white/70 hover:bg-white/16`
    : `${btnBase} border border-[var(--app-ink)]/18 bg-[var(--app-paper)] text-[var(--app-ink)] hover:bg-[var(--app-bone)]`;

  const nav = (
    <nav
      className={isHero ? 'mt-5 flex flex-wrap gap-2.5 sm:mt-6' : 'mt-3 flex flex-wrap gap-2.5'}
      aria-label={`${project.title} links`}
    >
      {repoLink ? (
        <a
          href={repoLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className={primary}
          onClick={() => {
            trackLinkClick({
              profileId,
              projectId: project.id,
              linkCategory: repoLink.type === 'github' ? 'repo' : repoLink.type,
              kind: 'project',
            });
          }}
        >
          <FaGithub className="text-[1.05em]" aria-hidden />
          GitHub
        </a>
      ) : null}
      {liveLink ? (
        <a
          href={liveLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className={ghost}
          onClick={() => {
            trackLinkClick({
              profileId,
              projectId: project.id,
              linkCategory: liveLink.type,
              kind: 'project',
            });
          }}
        >
          <HiOutlinePlay className="text-[1.1em]" aria-hidden />
          {liveLink.label?.trim() || 'Live demo'}
        </a>
      ) : null}
      {resume ? (
        <a
          href={resume}
          target="_blank"
          rel="noopener noreferrer"
          className={ghost}
          onClick={() => {
            trackLinkClick({
              profileId,
              linkCategory: 'resume',
              kind: 'profile',
            });
          }}
        >
          <HiOutlineArrowDownTray className="text-[1.1em]" aria-hidden />
          Resume
        </a>
      ) : null}
    </nav>
  );

  if (isHero) return nav;

  return (
    <div className="mb-8 rounded-[18px] border border-[color-mix(in_srgb,var(--app-ink,#232324)_12%,transparent)] bg-[var(--app-paper,#ffffff)] p-4 shadow-rim sm:p-5">
      <p className="font-eyebrow text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--app-muted,#5c5856)]">
        Open &amp; share
      </p>
      {nav}
    </div>
  );
}
