'use client';

import { useState } from 'react';
import { LayoutGrid, Rows3 } from 'lucide-react';
import type {
  PortfolioCreator,
  PortfolioOpenTransition,
  PortfolioProject,
} from '@/lib/dashboard/portfolio';
import type { ResearchPaper } from '@/lib/research/research';
import { EMPTY_STATE_COPY } from '@/lib/dashboard/empty-state-copy';
import {
  publicDemoProfileBasePath,
  workspaceCreateProjectHref,
  workspaceCreateResearchHref,
} from '@/lib/marketing/demo-url';
import { DashboardProjectsPortfolio } from './dashboard-projects-portfolio';
import { DashboardResearchView } from './dashboard-research-view';
import { AppButton } from './ui/dashboard-ui';

const VIEW_MODES = [
  { id: 'list' as const, label: 'List', icon: Rows3 },
  { id: 'grid' as const, label: 'Grid', icon: LayoutGrid },
];

type WorkViewMode = (typeof VIEW_MODES)[number]['id'];

export function DashboardYourWorkView({
  creator,
  projects,
  emptyProjects = false,
  papers,
  profileSlug,
  profileId,
  isProfilePublic = false,
  basePath = '/dashboard',
  openTransition,
}: {
  creator: PortfolioCreator;
  projects: PortfolioProject[];
  emptyProjects?: boolean;
  papers: ResearchPaper[];
  profileSlug?: string | null;
  profileId?: string;
  isProfilePublic?: boolean;
  basePath?: string;
  openTransition?: PortfolioOpenTransition;
}) {
  const [viewMode, setViewMode] = useState<WorkViewMode>('grid');
  const hasProjects = projects.length > 0 && !emptyProjects;
  const hasPapers = papers.length > 0;
  const emptyWorkspace = !hasProjects && !hasPapers;
  const publicCardHref = profileSlug ? publicDemoProfileBasePath(profileSlug) : null;
  const projectCountLabel = `${projects.length} project${projects.length === 1 ? '' : 's'}`;
  const paperCountLabel = `${papers.length} paper${papers.length === 1 ? '' : 's'}`;

  return (
    <div className="cc-app-page cc-app-page--1040 cc-your-work">
      <header className="cc-your-work__header">
        <div>
          <p className="cc-workspace-section__eyebrow">Your Work</p>
          <h1 className="cc-workspace-section__title">What appears on your CodeCard</h1>
          <p className="cc-workspace-section__copy">
            Build projects and research here. Published items appear on your public CodeCard.
          </p>
          {publicCardHref && isProfilePublic ? (
            <p className="mt-3">
              <AppButton variant="ghost" href={publicCardHref} ariaLabel="View public CodeCard">
                View public CodeCard
              </AppButton>
            </p>
          ) : (
            <p className="mt-2 text-[13px] text-[var(--app-smoke)]">
              Publishing a project or paper is not enough on its own — the CodeCard itself also
              needs to be public before visitors can open it.
            </p>
          )}
        </div>
        {emptyWorkspace ? null : (
          <div className="cc-projects-view-toggle" role="group" aria-label="Work layout">
            {VIEW_MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewMode(id)}
                className={`cc-projects-view-toggle__btn ${
                  viewMode === id ? 'cc-projects-view-toggle__btn--active' : ''
                }`}
                aria-pressed={viewMode === id}
                aria-label={label}
                title={label}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </button>
            ))}
          </div>
        )}
      </header>

      {emptyWorkspace ? (
        <div className="mx-auto max-w-xl space-y-4 text-center">
          <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
            {EMPTY_STATE_COPY.work.title}
          </h2>
          <p className="text-[15px] leading-relaxed text-[var(--app-smoke)]">
            {EMPTY_STATE_COPY.work.description}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <AppButton
              variant="primary"
              href={workspaceCreateProjectHref(basePath)}
              ariaLabel={EMPTY_STATE_COPY.work.projectCta}
            >
              {EMPTY_STATE_COPY.work.projectCta}
            </AppButton>
            <AppButton
              variant="ghost"
              href={workspaceCreateResearchHref(basePath)}
              ariaLabel={EMPTY_STATE_COPY.work.researchCta}
            >
              {EMPTY_STATE_COPY.work.researchCta}
            </AppButton>
          </div>
        </div>
      ) : (
        <>
          <section
            id="projects"
            className="cc-your-work__section scroll-mt-24"
            aria-labelledby="your-work-projects"
          >
            <div className="cc-your-work__section-head">
              <p className="cc-workspace-section__eyebrow">Projects</p>
              <h2 id="your-work-projects" className="cc-workspace-section__title">
                Projects
              </h2>
              <p className="cc-workspace-section__copy">
                Things you have built. {hasProjects ? `${projectCountLabel}. ` : ''}
                Published projects can appear on your public CodeCard.
              </p>
            </div>
            <DashboardProjectsPortfolio
              creator={creator}
              projects={projects}
              emptyState={!hasProjects}
              basePath={basePath}
              openTransition={openTransition}
              embedded
              viewMode={viewMode === 'grid' ? 'grid' : 'stack'}
            />
          </section>

          <section
            id="research"
            className="cc-your-work__section scroll-mt-24"
            aria-labelledby="your-work-research"
          >
            <div className="cc-your-work__section-head">
              <p className="cc-workspace-section__eyebrow">Research</p>
              <h2 id="your-work-research" className="cc-workspace-section__title">
                Research
              </h2>
              <p className="cc-workspace-section__copy">
                Things you have investigated. {hasPapers ? `${paperCountLabel}. ` : ''}
                Published research can appear on your public CodeCard.
              </p>
            </div>
            <DashboardResearchView
              papers={papers}
              profileSlug={profileSlug}
              profileId={profileId}
              isProfilePublic={isProfilePublic}
              basePath={basePath}
              embedded
              viewMode={viewMode}
            />
          </section>
        </>
      )}
    </div>
  );
}
