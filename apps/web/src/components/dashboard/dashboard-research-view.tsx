'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HiSquares2X2, HiBars3BottomLeft } from 'react-icons/hi2';
import type { ResearchPaper } from '@/lib/research/research';
import { ResearchPaperCard } from '@/components/research/research-paper-card';
import { ResearchReorderToolbar } from '@/components/dashboard/research-reorder-toolbar';
import { ResearchBubbleGrid } from '@/components/dashboard/research-bubble-grid';
import { AppButton, AppCard, PageHeader } from './ui/dashboard-ui';

const VIEW_MODES = [
  { id: 'list' as const, label: 'List', icon: HiBars3BottomLeft },
  { id: 'grid' as const, label: 'Grid', icon: HiSquares2X2 },
];

type ViewMode = (typeof VIEW_MODES)[number]['id'];

function paperPublicHref(
  paper: ResearchPaper,
  profileSlug: string | null | undefined,
  isProfilePublic: boolean,
): string | null {
  if (!paper.isPublished || !isProfilePublic || !profileSlug || !paper.slug) {
    return null;
  }
  if (profileSlug === 'demo') {
    return `/demo/research/${paper.slug}`;
  }
  return `/${profileSlug}/research/${paper.slug}`;
}

export function DashboardResearchView({
  papers,
  profileSlug,
  profileId,
  isProfilePublic = false,
  basePath = '/dashboard',
}: {
  papers: ResearchPaper[];
  profileSlug?: string | null;
  profileId?: string;
  isProfilePublic?: boolean;
  basePath?: string;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const orderedPaperIds = papers.map((paper) => paper.id);
  const createHref = `${basePath}/research/new`;

  return (
    <div className="cc-app-page cc-app-page--1040 space-y-8">
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
            ) : null}
            <AppButton variant="primary" href={createHref} ariaLabel="Add research paper">
              Add research
            </AppButton>
          </div>
        }
      />

      {papers.length > 0 ? (
        viewMode === 'grid' ? (
          <ResearchBubbleGrid papers={papers} basePath={basePath} />
        ) : (
          <div className="flex flex-col gap-8">
            {papers.map((paper, index) => {
              const editHref = `${basePath}/research/${paper.id}/edit`;
              const publicHref = paperPublicHref(paper, profileSlug, isProfilePublic);
              return (
                <div key={paper.id} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <ResearchReorderToolbar
                      paperId={paper.id}
                      paperTitle={paper.title}
                      index={index}
                      total={papers.length}
                      orderedPaperIds={orderedPaperIds}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={editHref}
                        className="cc-app-btn cc-app-btn--ghost text-[13px]"
                        aria-label={`Edit research paper ${paper.title}`}
                      >
                        Edit
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
          <p className="cc-app-mono">No research yet</p>
          <h2 className="cc-work-title cc-work-title--compact mt-3">
            Add your first paper
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--app-smoke)]">
            Capture title, authors, venue, DOI, citation, and links. Papers stay unpublished until you
            choose to share them.
          </p>
          <div className="mt-6 flex justify-center">
            <AppButton variant="primary" href={createHref} ariaLabel="Add research paper">
              Create paper
            </AppButton>
          </div>
        </AppCard>
      )}
    </div>
  );
}
