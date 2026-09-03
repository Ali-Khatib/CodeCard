'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { HiSquares2X2, HiBars3BottomLeft } from 'react-icons/hi2';
import type { ResearchPaper } from '@/lib/research/research';
import { ResearchPaperCard } from '@/components/research/research-paper-card';
import { ResearchReorderToolbar } from '@/components/dashboard/research-reorder-toolbar';
import { ResearchBubbleGrid } from '@/components/dashboard/research-bubble-grid';
import {
  isDemoWorkspacePath,
  publicDemoResearchHref,
  workspaceCreateResearchHref,
  workspaceResearchEditHref,
} from '@/lib/marketing/demo-url';
import { EMPTY_STATE_COPY } from '@/lib/dashboard/empty-state-copy';
import { AppButton, AppCard, FilterBar, PageHeader } from './ui/dashboard-ui';

const VIEW_MODES = [
  { id: 'list' as const, label: 'List', icon: HiBars3BottomLeft },
  { id: 'grid' as const, label: 'Grid', icon: HiSquares2X2 },
];

type ViewMode = (typeof VIEW_MODES)[number]['id'];

const ALL_RESEARCH_FILTER = 'All';

function getResearchFilterOptions(papers: ResearchPaper[]): string[] {
  const tags = new Set<string>();
  papers.forEach((paper) => {
    paper.tags.forEach((tag) => {
      if (tag.trim()) tags.add(tag.trim());
    });
  });
  return [ALL_RESEARCH_FILTER, ...Array.from(tags)];
}

function paperPublicHref(
  paper: ResearchPaper,
  profileSlug: string | null | undefined,
  isProfilePublic: boolean,
): string | null {
  if (!paper.isPublished || !isProfilePublic || !profileSlug || !paper.slug) {
    return null;
  }
  return publicDemoResearchHref(profileSlug, paper.slug, 'research');
}

export function DashboardResearchView({
  papers,
  profileSlug,
  profileId,
  isProfilePublic = false,
  basePath = '/dashboard',
  embedded = false,
  viewMode: viewModeProp,
}: {
  papers: ResearchPaper[];
  profileSlug?: string | null;
  profileId?: string;
  isProfilePublic?: boolean;
  basePath?: string;
  embedded?: boolean;
  viewMode?: ViewMode;
}) {
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState(ALL_RESEARCH_FILTER);
  const viewMode = viewModeProp ?? internalViewMode;
  const researchFilters = useMemo(() => getResearchFilterOptions(papers), [papers]);
  const visiblePapers = useMemo(
    () =>
      filter === ALL_RESEARCH_FILTER
        ? papers
        : papers.filter((paper) => paper.tags.some((tag) => tag.trim() === filter)),
    [papers, filter],
  );
  const orderedPaperIds = papers.map((paper) => paper.id);
  const isDemoWorkspace = isDemoWorkspacePath(basePath);
  const createHref = workspaceCreateResearchHref(basePath);
  const createLabel = isDemoWorkspace ? 'Sign in to add research' : 'Add research';

  return (
    <div className={embedded ? 'space-y-8' : 'cc-app-page cc-app-page--1040 space-y-8'}>
      {embedded ? (
        <div className="cc-projects-toolbar">
          <div className="flex flex-wrap items-center gap-3">
            {researchFilters.length > 1 ? (
              <FilterBar
                options={researchFilters}
                value={filter}
                onChange={setFilter}
                ariaLabel="Research filters"
              />
            ) : null}
          </div>
          <AppButton variant="primary" href={createHref} ariaLabel={createLabel}>
            {isDemoWorkspace ? 'Sign in to add' : 'Add research'}
          </AppButton>
        </div>
      ) : (
      <PageHeader
        eyebrow="Research"
        title="Papers & publications"
        description="Showcase abstracts, citations, PDFs, figures, and the projects connected to your research."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {papers.length > 0 ? (
              <div className="cc-projects-view-toggle" role="group" aria-label="Research layout">
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
            ) : null}
            <AppButton variant="primary" href={createHref} ariaLabel={createLabel}>
              {isDemoWorkspace ? 'Sign in to add' : 'Add research'}
            </AppButton>
          </div>
        }
      />
      )}

      {visiblePapers.length > 0 ? (
        viewMode === 'grid' ? (
          <ResearchBubbleGrid papers={visiblePapers} basePath={basePath} readOnly={isDemoWorkspace} />
        ) : (
          <div className="flex flex-col gap-8">
            {visiblePapers.map((paper, index) => {
              const editHref = workspaceResearchEditHref(basePath, paper.id);
              const publicHref = paperPublicHref(paper, profileSlug, isProfilePublic);
              return (
                <div key={paper.id} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {!isDemoWorkspace ? (
                      <ResearchReorderToolbar
                        paperId={paper.id}
                        paperTitle={paper.title}
                        index={index}
                        total={papers.length}
                        orderedPaperIds={orderedPaperIds}
                      />
                    ) : (
                      <p className="text-[12px] text-[var(--app-smoke)]">
                        Sign in to reorder and edit research.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={editHref}
                        className="cc-app-btn cc-app-btn--ghost text-[13px]"
                        aria-label={
                          isDemoWorkspace
                            ? `Sign in to edit ${paper.title}`
                            : `Edit research paper ${paper.title}`
                        }
                      >
                        {isDemoWorkspace ? 'Sign in to edit' : 'Edit'}
                      </Link>
                      {publicHref ? (
                        <Link
                          href={publicHref}
                          className="cc-app-btn cc-app-btn--ghost text-[13px]"
                          aria-label={`View ${paper.title} publicly`}
                        >
                          View public
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <ResearchPaperCard
                    paper={paper}
                    href={publicHref ?? editHref}
                    profileId={profileId}
                    delay={index * 0.06}
                  />
                </div>
              );
            })}
          </div>
        )
      ) : (
        <AppCard className="!p-8 text-center">
          <p className="cc-app-mono">Research</p>
          <h2 className="cc-work-title cc-work-title--compact mt-3">
            {papers.length > 0 ? 'No papers match this filter.' : EMPTY_STATE_COPY.research.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--app-smoke)]">
            {EMPTY_STATE_COPY.research.description}
          </p>
          <div className="mt-6 flex justify-center">
            <AppButton variant="primary" href={createHref} ariaLabel={createLabel}>
              {isDemoWorkspace ? 'Sign in to add research' : EMPTY_STATE_COPY.research.cta}
            </AppButton>
          </div>
        </AppCard>
      )}
    </div>
  );
}
