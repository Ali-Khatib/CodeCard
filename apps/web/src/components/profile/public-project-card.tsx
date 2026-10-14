'use client';

import Image from 'next/image';
import type { Ref } from 'react';
import type { FeaturedProject } from '@/lib/projects/featured';
import { ContentOpeningLink } from '@/components/navigation/content-opening-transition';
import { ProjectTechLine } from '@/components/projects/project-tech-line';
import { publicDemoProjectHref } from '@/lib/marketing/demo-url';
import { cn } from '@/lib/utils';

export type PublicProjectCardProps = {
  project: FeaturedProject;
  profileId?: string;
  profileSlug?: string;
  className?: string;
  /** Extra class on the media frame (stacking parallax target). */
  mediaClassName?: string;
  mediaRef?: Ref<HTMLDivElement>;
};

/** Gallery card: cover, name, and a compact technology line. Details live on the project page. */
export function PublicProjectCard({
  project,
  profileSlug = 'demo',
  className,
  mediaClassName,
  mediaRef,
}: PublicProjectCardProps) {
  const detailHref = publicDemoProjectHref(profileSlug, project.id, 'preview');

  return (
    <article className={cn('cc-app-project-card', className)}>
      <ContentOpeningLink
        href={detailHref}
        kind="project"
        itemTitle={project.title}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-iris)]"
        aria-label={`Open project: ${project.title}`}
      >
        <div ref={mediaRef} className={cn('cc-app-project-card__media relative', mediaClassName)}>
          {project.posterUrl ? (
            <Image
              src={project.posterUrl}
              alt=""
              fill
              loading="lazy"
              data-card-media
              className="cc-app-project-card__media-inner object-contain"
              quality={90}
              sizes="(max-width: 920px) 100vw, 920px"
            />
          ) : null}
        </div>
        <div className="cc-app-project-card__body">
          <h3 className="cc-fit-title cc-work-title break-words">{project.title}</h3>
          <ProjectTechLine technologies={project.technologies} className="mt-1.5" />
        </div>
      </ContentOpeningLink>
    </article>
  );
}
