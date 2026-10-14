'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { HiOutlineEye, HiOutlinePencil } from 'react-icons/hi2';
import { ProjectTechLine } from '@/components/projects/project-tech-line';
import { RevealProjectImages } from '@/components/ui/reveal-images';
import { useContentOpeningOptional } from '@/components/navigation/content-opening-transition';
import type { PortfolioOpenTransition, PortfolioProject } from '@/lib/dashboard/portfolio';
import { FadeInView } from './fade-in-view';
import { ProjectHoverCard } from './project-hover-card';
import { PopIconButton } from './ui/dashboard-ui';
import { ProjectReorderToolbar } from './project-reorder-toolbar';

const FALLBACK =
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80';

function ProjectRow({
  project,
  index,
  orderedProjectIds,
  canReorder,
}: {
  project: PortfolioProject;
  index: number;
  basePath: string;
  orderedProjectIds: string[];
  canReorder: boolean;
  openTransition?: PortfolioOpenTransition;
}) {
  const isPublished = project.isPublished === true;
  const router = useRouter();
  const opening = useContentOpeningOptional();
  const viewHref = project.href;

  const openProjectView = () => {
    if (opening) {
      opening.navigateWithOpening({
        kind: 'project',
        title: project.title,
        href: viewHref,
      });
      return;
    }
    router.push(viewHref);
  };

  const revealImages = [
    ...(project.screenshots ?? []),
    ...(project.posterUrl ? [project.posterUrl] : []),
  ].map((src, imageIndex) => ({
    src,
    alt: `${project.title} preview ${imageIndex + 1}`,
  }));

  return (
    <FadeInView delay={index * 0.06}>
      <ProjectHoverCard
        className="group/project cc-project-row-card cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-iris)]"
        role="button"
        tabIndex={0}
        aria-label={`View project: ${project.title}`}
        onClick={() => openProjectView()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openProjectView();
          }
        }}
      >
        <div className="cc-project-row">
          <div className="cc-project-hover-card__media">
            <Image
              src={project.posterUrl ?? FALLBACK}
              alt=""
              fill
              className="cc-project-hover-card__image object-contain"
              sizes="(max-width: 768px) 100vw, 1040px"
              priority={index === 0}
            />
            <RevealProjectImages images={revealImages} />
          </div>

          <div className="cc-project-row__body cc-project-hover-card__body">
            <div className="cc-project-hover-card__head flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="cc-fit-title cc-work-title cc-work-title--compact cc-project-hover-card__title flex-1">
                {project.title}
              </h2>
              <span
                className={`cc-project-hover-card__badge cc-app-badge text-[11px] ${isPublished ? 'cc-app-badge--mint' : 'cc-app-badge--blush'}`}
              >
                {isPublished ? 'Published' : 'Draft'}
              </span>
            </div>

            <ProjectTechLine technologies={project.technologies} className="mt-1.5" />

            <div
              className="cc-project-card-actions mt-5 flex flex-col gap-3"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {canReorder ? (
                <ProjectReorderToolbar
                  projectId={project.id}
                  index={index}
                  total={orderedProjectIds.length}
                  orderedProjectIds={orderedProjectIds}
                />
              ) : null}
              <div className="flex flex-wrap gap-2">
              <PopIconButton
                variant="primary"
                href={project.editHref}
                icon={<HiOutlinePencil aria-hidden />}
                ariaLabel={`Edit ${project.title}`}
              >
                Edit
              </PopIconButton>
              {project.publicHref ? (
                <PopIconButton
                  href={project.publicHref}
                  icon={<HiOutlineEye aria-hidden />}
                  popDelay={60}
                  ariaLabel={`View ${project.title} publicly`}
                >
                  View public
                </PopIconButton>
              ) : null}
              </div>
            </div>
          </div>
        </div>
      </ProjectHoverCard>
    </FadeInView>
  );
}

export function ProjectsVerticalStack({
  projects,
  basePath = '/dashboard',
  orderedProjectIds,
  canReorder = false,
  openTransition: _openTransition,
}: {
  projects: PortfolioProject[];
  basePath?: string;
  orderedProjectIds?: string[];
  canReorder?: boolean;
  openTransition?: PortfolioOpenTransition;
}) {
  const ids = orderedProjectIds ?? projects.map((project) => project.id);

  return (
    <div className="cc-project-stack">
      {projects.map((project, index) => (
        <ProjectRow
          key={project.id}
          project={project}
          index={index}
          basePath={basePath}
          orderedProjectIds={ids}
          canReorder={canReorder}
        />
      ))}
    </div>
  );
}
