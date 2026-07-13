'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { PortfolioProject } from '@/lib/dashboard/portfolio';
import { AppButton } from './ui/dashboard-ui';

function firstSentence(text?: string): string | null {
  if (!text) return null;
  const line = text.split('\n').find((l) => l.trim())?.trim();
  if (!line) return null;
  const match = line.match(/^[^.!?]+[.!?]?/);
  return match?.[0]?.trim() ?? line;
}

export function DashboardProjectManageCard({
  project,
  editHref,
}: {
  project: PortfolioProject;
  editHref?: string;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const impact = firstSentence(project.description);
  const githubClicks = Math.round((project.views ?? 0) * 0.28);
  const editLink = editHref ?? `${project.href}/edit`;

  return (
    <article
      className="cc-app-project-card cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-iris)]"
      role="button"
      tabIndex={0}
      aria-label={`Open ${project.title}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(project.href)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          router.push(project.href);
        }
      }}
    >
      <div className="cc-app-project-card__media">
        <span className="cc-app-project-card__drag" aria-hidden title="Drag to reorder">
          ⋮⋮
        </span>
        {project.posterUrl ? (
          <>
            <Image
              src={project.posterUrl}
              alt=""
              fill
              className="cc-app-project-card__media-inner"
              sizes="(max-width: 1040px) 100vw, 1040px"
            />
            {project.videoUrl && hovered && (
              <video
                className="cc-app-project-card__media-inner absolute inset-0"
                src={project.videoUrl}
                muted
                loop
                playsInline
                autoPlay
              />
            )}
          </>
        ) : null}
      </div>

      <div className="cc-app-project-card__body">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              project.isPublished !== false ? 'cc-app-badge cc-app-badge--mint' : 'cc-app-badge cc-app-badge--blush'
            }
          >
            {project.isPublished !== false ? 'Published' : 'Draft'}
          </span>
        </div>

        <h3 className="cc-fit-title cc-work-title mt-4">
          {project.title}
        </h3>

        {project.tagline && (
          <p className="mt-2 text-[16px] text-[var(--app-ink)]">{project.tagline}</p>
        )}

        {impact && (
          <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-[var(--app-smoke)]">{impact}</p>
        )}

        {project.technologies.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {project.technologies.slice(0, 6).map((tech) => (
              <span key={tech} className="cc-app-tech-tag">
                {tech}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          <span className="cc-app-inline-metric">
            <strong>{project.views ?? 0}</strong> views
          </span>
          <span className="cc-app-inline-metric">
            <strong>{project.saves ?? 0}</strong> saves
          </span>
          <span className="cc-app-inline-metric">
            <strong>{githubClicks}</strong> GitHub clicks
          </span>
        </div>

        <div
          className="mt-6 flex flex-wrap gap-2"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Link href={editLink}>
            <AppButton variant="primary">Edit</AppButton>
          </Link>
          <Link href={project.href}>
            <AppButton variant="ghost">Preview</AppButton>
          </Link>
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer">
              <AppButton variant="ghost">Live demo</AppButton>
            </a>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noreferrer">
              <AppButton variant="ghost">GitHub</AppButton>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
