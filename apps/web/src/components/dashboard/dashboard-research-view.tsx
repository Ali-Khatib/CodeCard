'use client';

import Link from 'next/link';
import type { ResearchPaper } from '@/lib/research/research';
import { ResearchPaperCard } from '@/components/research/research-paper-card';
import { ResearchReorderToolbar } from '@/components/dashboard/research-reorder-toolbar';
import { AppButton, AppCard, PageHeader } from './ui/dashboard-ui';

export function DashboardResearchView({
  papers,
  profileSlug,
  profileId,
}: {
  papers: ResearchPaper[];
  profileSlug?: string | null;
  profileId?: string;
}) {
  const baseProfileHref = profileSlug ? `/${profileSlug}` : null;
  const orderedPaperIds = papers.map((paper) => paper.id);

  return (
    <div className="cc-app-page cc-app-page--1040 space-y-8">
      <PageHeader
        eyebrow="Research"
        title="Papers & publications"
        description="Showcase abstracts, citations, PDFs, figures, and the projects connected to your research."
        actions={
          <AppButton variant="primary" href="/dashboard/research/new">
            Add research
          </AppButton>
        }
      />

      {papers.length > 0 ? (
        <div className="flex flex-col gap-8">
          {papers.map((paper, index) => (
            <div key={paper.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <ResearchReorderToolbar
                  paperId={paper.id}
                  paperTitle={paper.title}
                  index={index}
                  total={papers.length}
                  orderedPaperIds={orderedPaperIds}
                />
                <Link
                  href={`/dashboard/research/${paper.id}/edit`}
                  className="cc-app-btn cc-app-btn--ghost text-[13px]"
                  aria-label={`Edit research paper ${paper.title}`}
                >
                  Edit
                </Link>
              </div>
              <ResearchPaperCard
                paper={paper}
                href={baseProfileHref ? `${baseProfileHref}/research/${paper.slug}` : '#'}
                profileId={profileId}
                delay={index * 0.06}
              />
            </div>
          ))}
        </div>
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
            <AppButton variant="primary" href="/dashboard/research/new">
              Create paper
            </AppButton>
          </div>
        </AppCard>
      )}
    </div>
  );
}
