'use client';

import { useMemo, useState } from 'react';
import type { PortfolioCreator, PortfolioProject } from '@/lib/dashboard/portfolio';
import { ProjectsProfileStrip } from './projects-profile-strip';
import { FadeInView } from './fade-in-view';
import { ProjectsVerticalStack } from './projects-vertical-stack';
import { FilterBar, AppButton } from './ui/dashboard-ui';

const PROJECT_FILTERS = ['All', 'Published', 'Draft', 'With demo'] as const;
type ProjectFilter = (typeof PROJECT_FILTERS)[number];

const SORT_OPTIONS = ['Visitor order', 'Most views', 'Recently updated'] as const;
type ProjectSort = (typeof SORT_OPTIONS)[number];

function matchesFilter(project: PortfolioProject, filter: ProjectFilter): boolean {
  if (filter === 'All') return true;
  if (filter === 'Published') return project.isPublished !== false;
  if (filter === 'Draft') return project.isPublished === false;
  if (filter === 'With demo') return Boolean(project.liveUrl || project.videoUrl);
  return true;
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
  const [filter, setFilter] = useState<ProjectFilter>('All');
  const [sort, setSort] = useState<ProjectSort>('Visitor order');

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
            <FilterBar options={PROJECT_FILTERS} value={filter} onChange={setFilter} />
            <FilterBar options={SORT_OPTIONS} value={sort} onChange={setSort} />
          </div>
          <AppButton variant="primary" href={`${basePath}/projects/new`}>
            Create project
          </AppButton>
        </div>
      </FadeInView>

      {filteredProjects.length > 0 ? (
        <ProjectsVerticalStack projects={filteredProjects} basePath={basePath} />
      ) : (
        <FadeInView>
          <p className="py-12 text-center text-[15px] text-[var(--app-smoke)]">
            No projects match this filter.
          </p>
        </FadeInView>
      )}
    </div>
  );
}
