'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiOutlineEye, HiOutlinePencil } from 'react-icons/hi2';
import { TechLogoRow } from '@/components/profile/tech-logo-row';
import { RevealProjectImages } from '@/components/ui/reveal-images';
import { useProjectOpenOptional } from '@/components/featured-work/project-open-overlay';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { PortfolioOpenTransition, PortfolioProject } from '@/lib/dashboard/portfolio';
import type { FeaturedProject } from '@/lib/projects/featured';
import { FadeInView } from './fade-in-view';
import { ProjectHoverCard } from './project-hover-card';
import { PopIconButton } from './ui/dashboard-ui';
import { ProjectReorderToolbar } from './project-reorder-toolbar';

const FALLBACK =
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80';

function ProjectRow({
  project,
  index,
  basePath,
  orderedProjectIds,
  canReorder,
  openTransition,
  featuredSiblings,
}: {
  project: PortfolioProject;
  index: number;
  basePath: string;
  orderedProjectIds: string[];
  canReorder: boolean;
  openTransition?: PortfolioOpenTransition;
  featuredSiblings?: FeaturedProject[];
}) {
  const isPublished = project.isPublished !== false;
  const reduced = useReducedMotion();
  const router = useRouter();
  const openCtx = useProjectOpenOptional();

  const openProject = (element: HTMLElement | null) => {
    // Smooth card → page expand (same overlay as the public profile) when
    // the full featured payload is available; plain navigation otherwise.
    if (!reduced && openCtx && openTransition && project.featured && element) {
      openCtx.open(project.featured, element, project.editHref, {
        profileSlug: openTransition.profileSlug,
        displayName: openTransition.displayName,
        accentColor: openTransition.accentColor,
        projects: featuredSiblings,
      });
      return;
    }
    router.push(project.editHref);
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
        aria-label={`Open ${project.title}`}
        onClick={(event) => openProject(event.currentTarget)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openProject(event.currentTarget);
          }
        }}
      >
        <div className="cc-project-row">
          <div className="cc-project-hover-card__media">
            <Image
              src={project.posterUrl ?? FALLBACK}
              alt=""
              fill
              className="cc-project-hover-card__image object-cover"
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

            {project.tagline && (
              <p className="cc-project-hover-card__tagline mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--app-smoke)]">
                {project.tagline}
              </p>
            )}

            {typeof project.views === 'number' || typeof project.saves === 'number' ? (
              <p className="cc-project-hover-card__stats mt-3 text-[13px] text-[var(--app-smoke)]">
                {typeof project.views === 'number' ? `${project.views} views` : null}
                {typeof project.views === 'number' && typeof project.saves === 'number' ? ' · ' : null}
                {typeof project.saves === 'number' ? `${project.saves} saves` : null}
              </p>
            ) : null}

            <div className="cc-project-hover-card__cta-slot">
              <Link href={project.editHref} className="cc-project-hover-card__cta" tabIndex={-1}>
                Edit project →
              </Link>
            </div>

            {project.technologies.length > 0 && (
              <TechLogoRow
                technologies={project.technologies.slice(0, 8)}
                size="md"
                variant="chip"
                className="mt-4 gap-2"
                pop={!reduced}
              />
            )}

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
  openTransition,
}: {
  projects: PortfolioProject[];
  basePath?: string;
  orderedProjectIds?: string[];
  canReorder?: boolean;
  openTransition?: PortfolioOpenTransition;
}) {
  const ids = orderedProjectIds ?? projects.map((project) => project.id);
  const featuredSiblings = projects
    .map((project) => project.featured)
    .filter((featured): featured is FeaturedProject => Boolean(featured));

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
          openTransition={openTransition}
          featuredSiblings={featuredSiblings}
        />
      ))}
    </div>
  );
}
