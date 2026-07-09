'use client';

import { useMemo, useState } from 'react';
import { HiSquares2X2, HiBars3BottomLeft } from 'react-icons/hi2';
import type { PortfolioCreator, PortfolioProject } from '@/lib/dashboard/portfolio';
import { ProjectsProfileStrip } from './projects-profile-strip';
import { FadeInView } from './fade-in-view';
import { ProjectsVerticalStack } from './projects-vertical-stack';
import { ProjectsBubbleGrid } from './projects-bubble-grid';
import { FilterBar, AppButton } from './ui/dashboard-ui';

const ALL_PROJECTS_FILTER = 'All';

const SORT_OPTIONS = ['Visitor order', 'Most views', 'Recently updated'] as const;
type ProjectSort = (typeof SORT_OPTIONS)[number];

const VIEW_MODES = [
  { id: 'stack' as const, label: 'Stack', icon: HiBars3BottomLeft },
  { id: 'grid' as const, label: 'Grid', icon: HiSquares2X2 },
];

type ViewMode = (typeof VIEW_MODES)[number]['id'];

function getProjectFilterOptions(projects: PortfolioProject[]): string[] {
  const tech = new Set<string>();
  projects.forEach((project) => {
    project.technologies.forEach((item) => {
      if (item.trim()) tech.add(item.trim());
    });
  });

  return [ALL_PROJECTS_FILTER, ...Array.from(tech).sort((a, b) => a.localeCompare(b))];
}

function matchesFilter(project: PortfolioProject, filter: string): boolean {
  if (filter === ALL_PROJECTS_FILTER) return true;
  return project.technologies.some((tech) => tech.toLowerCase() === filter.toLowerCase());
}

function sortProjects(projects: PortfolioProject[], sort: ProjectSort): PortfolioProject[] {
  const list = [...projects];
  if (sort === 'Most views') {
    return list.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
  }
  if (sort === 'Recently updated') {
    return list.reverse();
  }
  return list;
}

export function DashboardProjectsPortfolio({
  creator,
  projects,
  emptyState = false,
  basePath = '/dashboard',
}: {
  creator: PortfolioCreator;
  projects: PortfolioProject[];
  emptyState?: boolean;
  basePath?: string;
}) {
  const [filter, setFilter] = useState<string>(ALL_PROJECTS_FILTER);
  const [sort, setSort] = useState<ProjectSort>('Visitor order');
  const [viewMode, setViewMode] = useState<ViewMode>('stack');
  const projectFilters = useMemo(() => getProjectFilterOptions(projects), [projects]);
  const filteredProjects = useMemo(() => {
    const filtered = projects.filter((p) => matchesFilter(p, filter));
    return sortProjects(filtered, sort);
  }, [projects, filter, sort]);

  if (emptyState) {
    return (
      <div className="cc-app-page cc-app-page--1040 space-y-10">
        <ProjectsProfileStrip creator={creator} />
        <p className="text-center text-[15px] text-[var(--app-smoke)]">
          Add your first project to feature on your CodeCard.
        </p>
        <div className="text-center">
          <AppButton variant="primary" href={`${basePath}/projects/new`}>
            Create project
          </AppButton>
        </div>
      </div>
    );
  }

  return (
    <div className="cc-app-page cc-app-page--1040">
      <ProjectsProfileStrip creator={creator} />

      <FadeInView delay={0.05}>
        <div className="cc-projects-toolbar">
          <div className="flex flex-wrap items-center gap-3">
            <FilterBar options={projectFilters} value={filter} onChange={setFilter} />
            <FilterBar options={SORT_OPTIONS} value={sort} onChange={setSort} />
            <div className="cc-projects-view-toggle" role="group" aria-label="Project layout">
              {VIEW_MODES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setViewMode(id)}
                  className={`cc-projects-view-toggle__btn ${viewMode === id ? 'cc-projects-view-toggle__btn--active' : ''}`}
                  aria-pressed={viewMode === id}
                  aria-label={label}
                  title={label}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </button>
              ))}
            </div>
          </div>
          <AppButton variant="primary" href={`${basePath}/projects/new`}>
            Create project
          </AppButton>
        </div>      </FadeInView>

      {filteredProjects.length > 0 ? (
        viewMode === 'grid' ? (
          <ProjectsBubbleGrid projects={filteredProjects} basePath={basePath} />
        ) : (
          <ProjectsVerticalStack projects={filteredProjects} basePath={basePath} />
        )
      ) : (        <FadeInView>
          <p className="py-12 text-center text-[15px] text-[var(--app-smoke)]">
            No projects match this filter.
          </p>
        </FadeInView>
      )}
    </div>
  );
}
