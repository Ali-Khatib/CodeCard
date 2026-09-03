'use client';

import { CountUp } from '@/components/landing/count-up';
import type { ResearchAnalyticsSummary } from '@/lib/dashboard/analytics-data';
import { AppCard, MetricLabel, SectionLabel, SectionSubtitle } from '../ui/dashboard-ui';

function formatTime(sec: number) {
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return rem ? `${min}m ${rem}s` : `${min}m`;
}

export function AnalyticsResearchPanel({ summary }: { summary: ResearchAnalyticsSummary }) {
  return (
    <section className="cc-analytics-research-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionLabel>Research analytics</SectionLabel>
          <SectionSubtitle>
            Paper views, PDF downloads, citation copies, and read-time signals.
          </SectionSubtitle>
        </div>
      </div>

      <AppCard className="cc-analytics-research-card mt-5 !p-5 md:!p-6">
        <div className="cc-analytics-research-summary">
          <div className="cc-analytics-stat-block">
            <MetricLabel>Research views</MetricLabel>
            <p className="cc-analytics-research-summary__value">
              <CountUp value={summary.views} />
            </p>
          </div>
          <div className="cc-analytics-stat-block">
            <MetricLabel>PDF downloads</MetricLabel>
            <p className="cc-analytics-research-summary__value">
              <CountUp value={summary.pdfDownloads} />
            </p>
          </div>
          <div className="cc-analytics-stat-block">
            <MetricLabel>Citation copies</MetricLabel>
            <p className="cc-analytics-research-summary__value">
              <CountUp value={summary.citationCopies} />
            </p>
          </div>
          <div className="cc-analytics-stat-block">
            <MetricLabel>Avg read time</MetricLabel>
            <p className="cc-analytics-research-summary__value">
              {formatTime(summary.avgReadTimeSec)}
            </p>
          </div>
        </div>

        <div className="cc-analytics-research-highlights">
          <div>
            <MetricLabel>Most viewed paper</MetricLabel>
            <p className="cc-analytics-research-highlights__text">{summary.mostViewedTitle}</p>
          </div>
          <div>
            <MetricLabel>Time spent per project</MetricLabel>
            <p className="cc-analytics-research-summary__value">
              {formatTime(summary.projectTimeSpentSec)}
            </p>
          </div>
          <div>
            <MetricLabel>Most engaged section</MetricLabel>
            <p className="cc-analytics-research-summary__value">
              {summary.mostEngagedProjectSection}
            </p>
          </div>
        </div>

        <div className="cc-analytics-paper-table-wrap">
          <div className="cc-analytics-paper-table__intro">
            <p className="cc-analytics-paper-table__heading">Per research paper</p>
            <p className="cc-analytics-paper-table__sub">
              One row per paper — scan metrics left to right.
            </p>
          </div>

          <div className="cc-analytics-paper-table" role="table" aria-label="Per research paper analytics">
            <div className="cc-analytics-paper-table__head" role="row">
              <span role="columnheader">Paper</span>
              <span role="columnheader">Views</span>
              <span role="columnheader">PDFs</span>
              <span role="columnheader">Citations</span>
              <span role="columnheader">Avg read</span>
              <span role="columnheader">Signal</span>
            </div>

            {summary.perPaper.map((paper) => (
              <div key={paper.id} className="cc-analytics-paper-table__row" role="row">
                <div className="cc-analytics-paper-table__paper" role="cell">
                  <p className="cc-analytics-paper-table__title">{paper.title}</p>
                </div>
                <p className="cc-analytics-paper-table__metric" role="cell" data-label="Views">
                  {paper.views.toLocaleString()}
                </p>
                <p className="cc-analytics-paper-table__metric" role="cell" data-label="PDFs">
                  {paper.pdfDownloads.toLocaleString()}
                </p>
                <p className="cc-analytics-paper-table__metric" role="cell" data-label="Citations">
                  {paper.citationCopies.toLocaleString()}
                </p>
                <p className="cc-analytics-paper-table__metric" role="cell" data-label="Avg read">
                  {formatTime(paper.avgReadTimeSec)}
                </p>
                <div className="cc-analytics-paper-table__signal" role="cell" data-label="Signal">
                  <span className="cc-analytics-paper-table__signal-chip">{paper.topSignal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AppCard>
    </section>
  );
}
