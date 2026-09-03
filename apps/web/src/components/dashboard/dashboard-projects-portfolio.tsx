'use client';

import { useMemo, useState } from 'react';
import { HiSquares2X2, HiBars3BottomLeft } from 'react-icons/hi2';
import type {
  PortfolioCreator,
  PortfolioOpenTransition,
  PortfolioProject,
} from '@/lib/dashboard/portfolio';
import { EMPTY_STATE_COPY } from '@/lib/dashboard/empty-state-copy';
import { workspaceCreateProjectHref } from '@/lib/marketing/demo-url';
import { ProjectsProfileStrip } from './projects-profile-strip';
import { FadeInView } from './fade-in-view';
import { ProjectsVerticalStack } from './projects-vertical-stack';
import { ProjectsBubbleGrid } from './projects-bubble-grid';
import { FilterBar, AppButton } from './ui/dashboard-ui';

const ALL_PROJECTS_FILTER = 'All';
const PROJECT_DOMAINS = [
  'GenAI',
  'AI / ML',
  'DevOps',
  'Data',
  'Observability',
  'Full Stack',
  'Backend',
  'Frontend',
] as const;
type ProjectDomain = (typeof PROJECT_DOMAINS)[number];

const SORT_OPTIONS = ['Visitor order', 'Most views', 'Recently updated'] as const;
type ProjectSort = (typeof SORT_OPTIONS)[number];

const VIEW_MODES = [
  { id: 'stack' as const, label: 'Stack', icon: HiBars3BottomLeft },
  { id: 'grid' as const, label: 'Grid', icon: HiSquares2X2 },
];

type ViewMode = (typeof VIEW_MODES)[number]['id'];

const DOMAIN_KEYWORDS: Record<ProjectDomain, string[]> = {
  GenAI: ['llm', 'genai', 'prompt', 'openai', 'rag'],
  'AI / ML': ['python', 'ml', 'machine learning', 'ai'],
  DevOps: ['docker', 'terraform', 'github actions', 'ci/cd', 'cli'],
  Data: ['clickhouse', 'postgresql', 'sqlite', 'redis', 'database'],
  Observability: ['opentelemetry', 'grafana', 'prometheus', 'observability'],
  'Full Stack': ['next.js', 'react', 'node.js', 'typescript', 'fastapi'],
  Backend: ['node.js', 'fastapi', 'grpc', 'api', 'rust'],
  Frontend: ['react', 'next.js', 'typescript'],
};

function projectMatchesDomain(project: PortfolioProject, domain: ProjectDomain): boolean {
  const haystack = [
    project.title,
    project.tagline ?? '',
    project.description ?? '',
    ...project.technologies,
  ]
    .join(' ')
    .toLowerCase();

  return DOMAIN_KEYWORDS[domain].some((keyword) => haystack.includes(keyword));
}

function getPrimaryProjectDomain(project: PortfolioProject): ProjectDomain | null {
  return PROJECT_DOMAINS.find((domain) => projectMatchesDomain(project, domain)) ?? null;
}

function getProjectFilterOptions(projects: PortfolioProject[]): string[] {
  const domains = new Set<ProjectDomain>();
  projects.forEach((project) => {
    const domain = getPrimaryProjectDomain(project);
    if (domain) domains.add(domain);
  });

  return [
    ALL_PROJECTS_FILTER,
    ...Array.from(domains).slice(0, projects.length),
  ];
}

function matchesFilter(project: PortfolioProject, filter: string): boolean {
  if (filter === ALL_PROJECTS_FILTER) return true;
  return PROJECT_DOMAINS.includes(filter as ProjectDomain)
    ? getPrimaryProjectDomain(project) === filter
    : true;
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
  openTransition,
  embedded = false,
  viewMode: viewModeProp,
}: {
  creator: PortfolioCreator;
  projects: PortfolioProject[];
  emptyState?: boolean;
  basePath?: string;
  /** When set, cards open via the smooth expand overlay (demo/public detail). */
  openTransition?: PortfolioOpenTransition;
  embedded?: boolean;
  viewMode?: ViewMode;
}) {
  const [filter, setFilter] = useState<string>(ALL_PROJECTS_FILTER);
  const [sort, setSort] = useState<ProjectSort>('Visitor order');
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('stack');
  const viewMode = viewModeProp ?? internalViewMode;
  const projectFilters = useMemo(() => getProjectFilterOptions(projects), [projects]);
  const filteredProjects = useMemo(() => {
    const filtered = projects.filter((p) => matchesFilter(p, filter));
    return sortProjects(filtered, sort);
  }, [projects, filter, sort]);

  if (emptyState) {
    return (
      <div className={embedded ? 'space-y-10' : 'cc-app-page cc-app-page--1040 space-y-10'}>
        {embedded ? null : (
        <ProjectsProfileStrip
          creator={creator}
          editHref={basePath.startsWith('/dashboard') ? `${basePath}#profile` : undefined}
        />
        )}
        <div className="mx-auto max-w-xl space-y-3 text-center">
          <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
            {EMPTY_STATE_COPY.projects.title}
          </h2>
          <p className="text-[15px] leading-relaxed text-[var(--app-smoke)]">
            {EMPTY_STATE_COPY.projects.description}
          </p>
        </div>
        <div className="text-center">
          <AppButton variant="primary" href={workspaceCreateProjectHref(basePath)} ariaLabel="Create project">
            {EMPTY_STATE_COPY.projects.cta}
          </AppButton>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? 'space-y-6' : 'cc-app-page cc-app-page--1040'}>
      {embedded ? null : (
      <ProjectsProfileStrip
        creator={creator}
        editHref={basePath.startsWith('/dashboard') ? `${basePath}#profile` : undefined}
      />
      )}

      <FadeInView delay={0.05}>
        <div className="cc-projects-toolbar">
          <div className="flex flex-wrap items-center gap-3">
            <FilterBar options={projectFilters} value={filter} onChange={setFilter} ariaLabel="Project filters" />
            <FilterBar options={SORT_OPTIONS} value={sort} onChange={setSort} ariaLabel="Project sort" />
            {embedded ? null : (
            <div className="cc-projects-view-toggle" role="group" aria-label="Project layout">
              {VIEW_MODES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setInternalViewMode(id)}
                  className={`cc-projects-view-toggle__btn ${viewMode === id ? 'cc-projects-view-toggle__btn--active' : ''}`}
                  aria-pressed={viewMode === id}
                  aria-label={label}
                  title={label}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </button>
              ))}
            </div>
            )}
          </div>
          <AppButton variant="primary" href={workspaceCreateProjectHref(basePath)} ariaLabel="Create project">
            Create project
          </AppButton>
        </div>
      </FadeInView>

      {filteredProjects.length > 0 ? (
        viewMode === 'grid' ? (
          <ProjectsBubbleGrid
            projects={filteredProjects}
            basePath={basePath}
            openTransition={openTransition}
          />
        ) : (
          <ProjectsVerticalStack
            projects={filteredProjects}
            basePath={basePath}
            orderedProjectIds={projects.map((project) => project.id)}
            canReorder={sort === 'Visitor order'}
            openTransition={openTransition}
          />
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
