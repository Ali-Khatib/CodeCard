'use client';

import { ContentOpeningLink } from '@/components/navigation/content-opening-transition';
import DraggableWidgetGrid, {
  type WidgetItem,
} from '@/components/ui/draggable-widget-grid';
import type { PortfolioOpenTransition, PortfolioProject } from '@/lib/dashboard/portfolio';
import { FolderKanban } from 'lucide-react';
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
      projects.map((project, index) => ({
        id: project.id,
        size: index === 0 ? 'wide' : 'sm',
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
        const isPublished = project.isPublished !== false;
        return (
          <ContentOpeningLink
            href={project.href}
            kind="project"
            itemTitle={project.title}
            className="cc-workspace-project-widget group"
            title={project.title}
            aria-label={`View ${project.title}`}
          >
            <div className="cc-workspace-project-widget__thumb">
              <Image
                src={project.posterUrl ?? FALLBACK}
                alt=""
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 90vw, 320px"
              />
              <span className="cc-workspace-project-widget__glyph" aria-hidden>
                <FolderKanban className="h-4 w-4" />
              </span>
            </div>
            <div className="cc-workspace-project-widget__meta">
              <p className="cc-fit-title cc-workspace-project-widget__title">{project.title}</p>
              <span
                className={`cc-projects-bubble__badge ${
                  isPublished ? 'cc-projects-bubble__badge--live' : ''
                }`}
              >
                {isPublished ? 'Live' : 'Draft'}
              </span>
            </div>
          </ContentOpeningLink>
        );
      }}
    />
  );
}
