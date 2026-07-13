'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { HiOutlineArrowTopRightOnSquare, HiOutlineEye, HiOutlinePencil } from 'react-icons/hi2';
import type { PortfolioProject } from '@/lib/dashboard/portfolio';
import {
  InteractiveImageAccordion,
  type ImageAccordionItem,
} from '@/components/ui/interactive-image-accordion';
import { AppButton, AppCard, AppMono } from './ui/dashboard-ui';

const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80';

function toAccordionItems(projects: PortfolioProject[], colorOffset: number): ImageAccordionItem[] {
  return projects.map((p, i) => ({
    id: p.id,
    title: p.title,
    subtitle: p.tagline,
    imageUrl: p.posterUrl ?? FALLBACK_POSTER,
    colorIndex: colorOffset + i,
  }));
}

export function ProjectsImageAccordion({
  projects,
  basePath = '/dashboard',
  colorOffset = 0,
  hideHero = false,
}: {
  projects: PortfolioProject[];
  basePath?: string;
  colorOffset?: number;
  hideHero?: boolean;
}) {
  const items = useMemo(() => toAccordionItems(projects, colorOffset), [projects, colorOffset]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, projects.length - 1)));
  }, [projects.length]);

  const active = projects[activeIndex] ?? projects[0];

  if (!active || items.length === 0) return null;

  const githubClicks = Math.round((active.views ?? 0) * 0.28);

  return (
    <div className="flex flex-col gap-6">
      <InteractiveImageAccordion
        items={items}
        activeIndex={activeIndex}
        onActiveChange={setActiveIndex}
      />

      <AppCard className="overflow-hidden !p-6 md:!p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <AppMono>{hideHero ? 'Selected project' : 'Project details'}</AppMono>
              <h3 className="mt-2 text-[24px] font-medium tracking-[-0.025em] text-[var(--app-ink)]">
                {active.title}
              </h3>
              {active.tagline && (
                <p className="mt-2 text-[15px] text-[var(--app-smoke)]">{active.tagline}</p>
              )}
              <p className="mt-3 text-[14px] text-[var(--app-smoke)]">
                <strong className="font-medium text-[var(--app-ink)]">{active.views ?? 0}</strong> views
                {' · '}
                <strong className="font-medium text-[var(--app-ink)]">{active.saves ?? 0}</strong> saves
                {' · '}
                <strong className="font-medium text-[var(--app-ink)]">{githubClicks}</strong> GitHub clicks
              </p>
            </div>
            <span
              className={
                active.isPublished !== false ? 'cc-app-badge cc-app-badge--mint' : 'cc-app-badge cc-app-badge--blush'
              }
            >
              {active.isPublished !== false ? 'Published' : 'Draft'}
            </span>
          </div>

          {active.technologies.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {active.technologies.slice(0, 6).map((tech) => (
                <span key={tech} className="cc-app-tech-tag">
                  {tech}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={`${basePath}/projects/${active.id}/edit`}>
              <AppButton variant="primary">
                <HiOutlinePencil className="h-4 w-4" aria-hidden />
                Edit
              </AppButton>
            </Link>
            <Link href={active.href}>
              <AppButton variant="ghost">
                <HiOutlineEye className="h-4 w-4" aria-hidden />
                Preview
              </AppButton>
            </Link>
            {active.liveUrl && (
              <a href={active.liveUrl} target="_blank" rel="noreferrer">
                <AppButton variant="ghost">
                  <HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                  Live demo
                </AppButton>
              </a>
            )}
            {active.repoUrl && (
              <a href={active.repoUrl} target="_blank" rel="noreferrer">
                <AppButton variant="ghost">GitHub</AppButton>
              </a>
            )}
          </div>
        </AppCard>
    </div>
  );
}
