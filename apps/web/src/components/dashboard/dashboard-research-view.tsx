'use client';

import type { ResearchPaper } from '@/lib/research/research';
import { ResearchPaperCard } from '@/components/research/research-paper-card';
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

  return (
    <div className="cc-app-page cc-app-page--1040 space-y-8">
      <PageHeader
        eyebrow="Research"
        title="Papers & publications"
        description="Showcase abstracts, citations, PDFs, figures, and the projects connected to your research."
        actions={
          <AppButton variant="primary" href="/dashboard/projects">
            Add from projects
          </AppButton>
        }
      />

      {papers.length > 0 ? (
        <div className="flex flex-col gap-8">
          {papers.map((paper, index) => (
            <ResearchPaperCard
              key={paper.id}
              paper={paper}
              href={baseProfileHref ? `${baseProfileHref}/research/${paper.slug}` : '#'}
              profileId={profileId}
              delay={index * 0.06}
            />
          ))}
        </div>
      ) : (
        <AppCard className="!p-8 text-center">
          <p className="cc-app-mono">No research yet</p>
          <h2 className="mt-3 text-[28px] font-medium tracking-[-0.03em] text-[var(--app-ink)]">
            Add papers without changing your project workflow.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--app-smoke)]">
            Research support is ready for abstracts, authors, venues, PDFs, citations, figures,
            and related projects. Existing projects stay exactly where they are.
          </p>
        </AppCard>
      )}
    </div>
  );
}
