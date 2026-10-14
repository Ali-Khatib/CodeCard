'use client';

import { ContentOpeningLink } from '@/components/navigation/content-opening-transition';
import { ProjectTechLine } from '@/components/projects/project-tech-line';
import DraggableWidgetGrid, {
  type WidgetItem,
} from '@/components/ui/draggable-widget-grid';
import type { PortfolioOpenTransition, PortfolioProject } from '@/lib/dashboard/portfolio';
import Image from 'next/image';
import { useMemo } from 'react';

const FALLBACK =
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80';

export function ProjectsWidgetGrid({
  projects,
}: {
  projects: PortfolioProject[];
  basePath?: string;
  openTransition?: PortfolioOpenTransition;
}) {
  const items = useMemo<WidgetItem[]>(
    () =>
      projects.map((project) => ({
        id: project.id,
        size: 'sm',
        label: project.title,
      })),
    [projects],
  );
  const byId = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  return (
    <DraggableWidgetGrid
      className="cc-workspace-widget-grid"
      items={items}
      maxColumns={4}
      cellSize={200}
      gap={12}
      radius={22}
      renderItem={(item) => {
        const project = byId.get(item.id);
        if (!project) return null;
        return (
          <ContentOpeningLink
            href={project.href}
            kind="project"
            itemTitle={project.title}
            className="cc-workspace-project-widget group"
            title={project.title}
            aria-label={`Open project: ${project.title}`}
          >
            <div className="cc-workspace-project-widget__thumb">
              <Image
                src={project.posterUrl ?? FALLBACK}
                alt=""
                fill
                className="object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.02] motion-reduce:group-hover:scale-100"
                sizes="(max-width: 640px) 90vw, 320px"
              />
            </div>
            <div className="cc-workspace-project-widget__meta">
              <p className="cc-fit-title cc-workspace-project-widget__title">{project.title}</p>
              <ProjectTechLine technologies={project.technologies} className="mt-1 line-clamp-2" />
            </div>
          </ContentOpeningLink>
        );
      }}
    />
  );
}
