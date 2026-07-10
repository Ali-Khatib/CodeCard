'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiOutlineEye, HiOutlinePencil } from 'react-icons/hi2';
import { TechLogoRow } from '@/components/profile/tech-logo-row';
import { RevealProjectImages } from '@/components/ui/reveal-images';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { PortfolioProject } from '@/lib/dashboard/portfolio';
import { FadeInView } from './fade-in-view';
import { ProjectHoverCard } from './project-hover-card';
import { PopIconButton } from './ui/dashboard-ui';

const FALLBACK =
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80';

function ProjectRow({
  project,
  index,
  basePath,
}: {
  project: PortfolioProject;
  index: number;
  basePath: string;
}) {
  const isPublished = project.isPublished !== false;
  const reduced = useReducedMotion();
  const router = useRouter();
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
        onClick={() => router.push(project.href)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            router.push(project.href);
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

            <p className="cc-project-hover-card__stats mt-3 text-[13px] text-[var(--app-smoke)]">
              {project.views ?? 0} views · {project.saves ?? 0} saves
            </p>

            <div className="cc-project-hover-card__cta-slot">
              <Link href={project.href} className="cc-project-hover-card__cta" tabIndex={-1}>
                View Project →
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
              className="cc-project-card-actions mt-5 flex flex-wrap gap-2"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <PopIconButton
                variant="primary"
                href={`${basePath}/projects/${project.id}`}
                icon={<HiOutlinePencil aria-hidden />}
              >
                Edit
              </PopIconButton>
              <PopIconButton href={project.href} icon={<HiOutlineEye aria-hidden />} popDelay={60}>
                Preview
              </PopIconButton>
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
}: {
  projects: PortfolioProject[];
  basePath?: string;
}) {
  return (
    <div className="cc-project-stack">
      {projects.map((project, index) => (
        <ProjectRow key={project.id} project={project} index={index} basePath={basePath} />
      ))}
    </div>
  );
}
