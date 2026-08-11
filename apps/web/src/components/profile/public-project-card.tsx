'use client';

import Image from 'next/image';
import { useState, type Ref } from 'react';
import type { FeaturedProject } from '@/lib/projects/featured';
import { firstSafeProjectLink } from '@/lib/projects/safe-project-link-url';
import { trackLinkClick } from '@/lib/analytics/link-click';
import { ContentOpeningLink } from '@/components/navigation/content-opening-transition';
import { publicDemoProfileBasePath } from '@/lib/marketing/demo-url';
import { cn } from '@/lib/utils';

function descriptionParts(description: string | null): { lead: string | null; rest: string[] } {
  if (!description) return { lead: null, rest: [] };
  const parts = description.split('\n').map((l) => l.trim()).filter(Boolean);
  return { lead: parts[0] ?? null, rest: parts.slice(1, 3) };
}

export type PublicProjectCardProps = {
  project: FeaturedProject;
  displayName: string;
  profileId?: string;
  profileSlug?: string;
  views: number;
  saves: number;
  className?: string;
  /** Extra class on the media frame (stacking parallax target). */
  mediaClassName?: string;
  mediaRef?: Ref<HTMLDivElement>;
};

/** Shared project card chrome — image, title, tech, CTAs. Used by flat + stacking layouts. */
export function PublicProjectCard({
  project,
  displayName,
  profileId,
  profileSlug = 'demo',
  views,
  saves,
  className,
  mediaClassName,
  mediaRef,
}: PublicProjectCardProps) {
  const [isOpen, setOpen] = useState(false);
  const base = publicDemoProfileBasePath(profileSlug);
  const liveLink = firstSafeProjectLink(project.links ?? [], ['live', 'demo']);
  const repoLink = firstSafeProjectLink(project.links ?? [], ['repo']);
  const liveUrl = liveLink?.url;
  const repoUrl = repoLink?.url;
  const { lead, rest } = descriptionParts(project.description);
  const detailHref = `${base}/projects/${project.id}`;

  return (
    <article
      className={cn(
        'cc-app-project-card',
        isOpen && 'cc-app-project-card--open',
        className,
      )}
    >
      <div ref={mediaRef} className={cn('relative', mediaClassName)}>
        <ContentOpeningLink
          href={detailHref}
          kind="project"
          itemTitle={project.title}
          className="cc-app-project-card__media cc-app-project-card__media--public group relative block outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-iris)]"
          aria-label={`Open project: ${project.title}`}
        >
          {project.posterUrl ? (
            <Image
              src={project.posterUrl}
              alt=""
              fill
              loading="lazy"
              data-card-media
              className="cc-app-project-card__media-inner"
              sizes="(max-width: 920px) 100vw, 920px"
            />
          ) : null}
        </ContentOpeningLink>
      </div>

      <div className="cc-app-project-card__body">
        <ContentOpeningLink
          href={detailHref}
          kind="project"
          itemTitle={project.title}
          className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-iris)]"
        >
          <h3 className="cc-fit-title cc-work-title break-words">{project.title}</h3>
        </ContentOpeningLink>
        {project.tagline ? (
          <p className="mt-2 break-words text-[16px] text-[var(--app-ink)]">{project.tagline}</p>
        ) : null}
        {lead ? (
          <p className="mt-2 max-w-[640px] break-words text-[15px] leading-relaxed text-[var(--app-smoke)]">
            {lead}
          </p>
        ) : null}

        {project.technologies.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {project.technologies.slice(0, 6).map((tech) => (
              <span key={tech} className="cc-app-tech-tag cc-chip-react">
                {tech}
              </span>
            ))}
          </div>
        ) : null}

        <p className="mt-4 text-[14px] text-[var(--app-smoke)]">
          <strong className="font-medium text-[var(--app-ink)]">{views}</strong> views ·{' '}
          <strong className="font-medium text-[var(--app-ink)]">{saves}</strong> saves
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <ContentOpeningLink
            href={detailHref}
            kind="project"
            itemTitle={project.title}
            className="cc-app-btn cc-app-btn--primary"
          >
            View project
          </ContentOpeningLink>
          <button
            type="button"
            className="cc-app-btn cc-app-btn--ghost"
            onClick={() => setOpen(!isOpen)}
          >
            {isOpen ? 'Hide details' : 'Quick details'}
          </button>
          {liveUrl && liveLink ? (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cc-app-btn cc-app-btn--ghost"
              onClick={() => {
                trackLinkClick({
                  profileId,
                  projectId: project.id,
                  linkCategory: liveLink.type,
                  kind: 'project',
                });
              }}
            >
              Live demo
            </a>
          ) : null}
          {repoUrl && repoLink ? (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cc-app-btn cc-app-btn--ghost"
              onClick={() => {
                trackLinkClick({
                  profileId,
                  projectId: project.id,
                  linkCategory: repoLink.type,
                  kind: 'project',
                });
              }}
            >
              GitHub
            </a>
          ) : null}
        </div>

        {isOpen ? (
          <div className="mt-8 overflow-hidden border-t border-[var(--app-border)] pt-8">
            {rest.length > 0 ? (
              <div className="space-y-4">
                {rest.map((para, i) => (
                  <p key={i} className="text-[15px] leading-relaxed text-[var(--app-smoke)]">
                    {para}
                  </p>
                ))}
              </div>
            ) : null}

            {project.screenshots.length > 0 ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {project.screenshots.slice(0, 4).map((src, i) => (
                  <div
                    key={src + i}
                    className="relative aspect-[16/10] overflow-hidden rounded-[16px] border border-[var(--app-border)] bg-[var(--app-bone)]"
                  >
                    <Image src={src} alt="" fill className="object-cover" sizes="400px" />
                  </div>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              className="cc-app-btn cc-app-btn--ghost mt-8"
              onClick={() => setOpen(false)}
            >
              ← Back to {displayName}&apos;s CodeCard
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
