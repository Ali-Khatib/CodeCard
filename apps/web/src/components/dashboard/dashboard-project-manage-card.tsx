'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { PortfolioProject } from '@/lib/dashboard/portfolio';
import {
  ContentOpeningLink,
  useContentOpeningOptional,
} from '@/components/navigation/content-opening-transition';
import { ProjectTechLine } from '@/components/projects/project-tech-line';
import { AppButton } from './ui/dashboard-ui';

export function DashboardProjectManageCard({
  project,
  editHref,
}: {
  project: PortfolioProject;
  editHref?: string;
}) {
  const opening = useContentOpeningOptional();
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const editLink = editHref ?? `${project.href}/edit`;

  const openProject = () => {
    if (opening) {
      opening.navigateWithOpening({
        kind: 'project',
        title: project.title,
        href: project.href,
      });
      return;
    }
    router.push(project.href);
  };

  return (
    <article
      className="cc-app-project-card cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-iris)]"
      role="button"
      tabIndex={0}
      aria-label={`Open ${project.title}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHovered(false);
        }
      }}
      onClick={() => openProject()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openProject();
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
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="cc-fit-title cc-work-title min-w-0 flex-1 break-words">{project.title}</h3>
          <span
            className={
              project.isPublished !== false ? 'cc-app-badge cc-app-badge--mint' : 'cc-app-badge cc-app-badge--blush'
            }
          >
            {project.isPublished !== false ? 'Published' : 'Draft'}
          </span>
        </div>
        <ProjectTechLine technologies={project.technologies} className="mt-1.5" />

        <div
          className="mt-4 flex flex-wrap gap-2"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Link href={editLink}>
            <AppButton variant="primary">Edit</AppButton>
          </Link>
          <ContentOpeningLink href={project.href} kind="project" itemTitle={project.title}>
            <AppButton variant="ghost">Preview</AppButton>
          </ContentOpeningLink>
        </div>
      </div>
    </article>
  );
}
