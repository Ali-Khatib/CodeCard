'use client';

import { useState } from 'react';
import { HiBars3BottomLeft, HiSquares2X2 } from 'react-icons/hi2';
import type {
  PortfolioCreator,
  PortfolioOpenTransition,
  PortfolioProject,
} from '@/lib/dashboard/portfolio';
import type { ResearchPaper } from '@/lib/research/research';
import { DashboardProjectsPortfolio } from './dashboard-projects-portfolio';
import { DashboardResearchView } from './dashboard-research-view';

const VIEW_MODES = [
  { id: 'list' as const, label: 'List', icon: HiBars3BottomLeft },
  { id: 'grid' as const, label: 'Grid', icon: HiSquares2X2 },
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
  const [viewMode, setViewMode] = useState<WorkViewMode>('list');

  return (
    <div className="cc-app-page cc-app-page--1040 cc-your-work">
      <header className="cc-your-work__header">
        <div>
          <p className="cc-workspace-section__eyebrow">Your work</p>
          <h1 className="cc-workspace-section__title">Projects and research</h1>
          <p className="cc-workspace-section__copy">
            One place for everything you ship — projects first, then papers.
          </p>
        </div>
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
      </header>

      <section id="projects" className="cc-your-work__section scroll-mt-24" aria-labelledby="your-work-projects">
        <div className="cc-your-work__section-head">
          <p className="cc-workspace-section__eyebrow">Projects</p>
          <h2 id="your-work-projects" className="cc-workspace-section__title">
            Built work
          </h2>
        </div>
        <DashboardProjectsPortfolio
          creator={creator}
          projects={projects}
          emptyState={emptyProjects}
          basePath={basePath}
          openTransition={openTransition}
          embedded
          viewMode={viewMode === 'grid' ? 'grid' : 'stack'}
        />
      </section>

      <section id="research" className="cc-your-work__section scroll-mt-24" aria-labelledby="your-work-research">
        <div className="cc-your-work__section-head">
          <p className="cc-workspace-section__eyebrow">Research</p>
          <h2 id="your-work-research" className="cc-workspace-section__title">
            Papers and publications
          </h2>
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
    </div>
  );
}
