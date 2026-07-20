'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { FeaturedProject } from '@/lib/projects/featured';
import { firstSafeProjectLink } from '@/lib/projects/safe-project-link-url';
import { trackLinkClick } from '@/lib/analytics/link-click';

function descriptionParts(description: string | null): { lead: string | null; rest: string[] } {
  if (!description) return { lead: null, rest: [] };
  const parts = description.split('\n').map((l) => l.trim()).filter(Boolean);
  return { lead: parts[0] ?? null, rest: parts.slice(1, 3) };
}

type PublicProjectStackProps = {
  projects: FeaturedProject[];
  displayName: string;
  profileId?: string;
  demoViews?: Record<string, { views: number; saves: number }>;
};

/** Public project cards without motion/framer — keeps LCP render-delay low (WS14-T019). */
export function PublicProjectStack({
  projects,
  displayName,
  profileId,
  demoViews,
}: PublicProjectStackProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-8">
      {projects.map((project, index) => {
        const isOpen = openId === project.id;
        const liveLink = firstSafeProjectLink(project.links ?? [], ['live', 'demo']);
        const repoLink = firstSafeProjectLink(project.links ?? [], ['repo']);
        const liveUrl = liveLink?.url;
        const repoUrl = repoLink?.url;
        const { lead, rest } = descriptionParts(project.description);
        const views = demoViews?.[project.id]?.views ?? 280 + index * 40;
        const saves = demoViews?.[project.id]?.saves ?? 24 + index * 8;

        return (
          <article
            key={project.id}
            className={`cc-app-project-card ${isOpen ? 'cc-app-project-card--open' : ''}`}
          >
            <div className="cc-app-project-card__media cc-app-project-card__media--public">
              {project.posterUrl ? (
                <Image
                  src={project.posterUrl}
                  alt=""
                  fill
                  loading="lazy"
                  className="cc-app-project-card__media-inner"
                  sizes="(max-width: 920px) 100vw, 920px"
                />
              ) : null}
            </div>

            <div className="cc-app-project-card__body">
              <h3 className="cc-fit-title cc-work-title break-words">{project.title}</h3>
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
                    <span key={tech} className="cc-app-tech-tag">
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
                <button
                  type="button"
                  className="cc-app-btn cc-app-btn--primary"
                  onClick={() => setOpenId(isOpen ? null : project.id)}
                >
                  {isOpen ? 'Close project' : 'Open project'}
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
                    onClick={() => setOpenId(null)}
                  >
                    ← Back to {displayName}&apos;s CodeCard
                  </button>
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
