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

function avgPerPaper(total: number, paperCount: number) {
  if (paperCount <= 0) return 0;
  return Math.round(total / paperCount);
}

function ratePct(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function AnalyticsResearchPanel({ summary }: { summary: ResearchAnalyticsSummary }) {
  const paperCount = summary.perPaper.length;
  const avgOpens = avgPerPaper(summary.views, paperCount);
  const avgPdfDownloads = avgPerPaper(summary.pdfDownloads, paperCount);
  const avgCiteCopies = avgPerPaper(summary.citationCopies, paperCount);
  const pdfRate = ratePct(summary.pdfDownloads, summary.views);
  const citeRate = ratePct(summary.citationCopies, summary.views);

  return (
    <section className="cc-analytics-research-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionLabel>Research analytics</SectionLabel>
          <SectionSubtitle>
            Tracked when someone opens a paper, downloads its PDF, copies the citation, or stays to
            read.
          </SectionSubtitle>
        </div>
      </div>

      <AppCard className="cc-analytics-research-card mt-5 !p-5 md:!p-6">
        <div className="cc-analytics-research-summary">
          <div className="cc-analytics-stat-block">
            <MetricLabel>Paper opens</MetricLabel>
            <p className="cc-analytics-research-summary__value">
              <CountUp value={summary.views} />
            </p>
            <p className="cc-analytics-stat-block__hint">Times a paper page was opened</p>
          </div>
          <div className="cc-analytics-stat-block">
            <MetricLabel>PDF downloads</MetricLabel>
            <p className="cc-analytics-research-summary__value">
              <CountUp value={summary.pdfDownloads} />
            </p>
            <p className="cc-analytics-stat-block__hint">Times the PDF file was downloaded</p>
          </div>
          <div className="cc-analytics-stat-block">
            <MetricLabel>Cite copies</MetricLabel>
            <p className="cc-analytics-research-summary__value">
              <CountUp value={summary.citationCopies} />
            </p>
            <p className="cc-analytics-stat-block__hint">Times “Copy citation” was used</p>
          </div>
          <div className="cc-analytics-stat-block">
            <MetricLabel>Avg time on paper</MetricLabel>
            <p className="cc-analytics-research-summary__value">
              {formatTime(summary.avgReadTimeSec)}
            </p>
            <p className="cc-analytics-stat-block__hint">Average active read time per visit</p>
          </div>
        </div>

        <div className="cc-analytics-research-highlights">
          <div>
            <MetricLabel>Most opened paper</MetricLabel>
            <p className="cc-analytics-research-highlights__text">{summary.mostViewedTitle}</p>
          </div>
          <div>
            <MetricLabel>Avg opens / paper</MetricLabel>
            <p className="cc-analytics-research-summary__value">
              <CountUp value={avgOpens} />
            </p>
          </div>
          <div>
            <MetricLabel>Avg PDF downloads / paper</MetricLabel>
            <p className="cc-analytics-research-summary__value">
              <CountUp value={avgPdfDownloads} />
            </p>
            <p className="cc-analytics-stat-block__hint">{pdfRate}% of opens</p>
          </div>
          <div>
            <MetricLabel>Avg cite copies / paper</MetricLabel>
            <p className="cc-analytics-research-summary__value">
              <CountUp value={avgCiteCopies} />
            </p>
            <p className="cc-analytics-stat-block__hint">{citeRate}% of opens</p>
          </div>
        </div>

        <div className="cc-analytics-paper-table-wrap">
          <div className="cc-analytics-paper-table__intro">
            <p className="cc-analytics-paper-table__heading">Per research paper</p>
            <p className="cc-analytics-paper-table__sub">
              Opens · PDF downloads · citation copies · average time spent reading that paper.
            </p>
          </div>

          <div className="cc-analytics-paper-table" role="table" aria-label="Per research paper analytics">
            <div className="cc-analytics-paper-table__head" role="row">
              <span role="columnheader">Paper</span>
              <span role="columnheader">Opens</span>
              <span role="columnheader">PDF downloads</span>
              <span role="columnheader">Cite copies</span>
              <span role="columnheader">Avg time</span>
            </div>

            {summary.perPaper.map((paper) => (
              <div key={paper.id} className="cc-analytics-paper-table__row" role="row">
                <div className="cc-analytics-paper-table__paper" role="cell">
                  <p className="cc-analytics-paper-table__title">{paper.title}</p>
                </div>
                <p className="cc-analytics-paper-table__metric" role="cell" data-label="Opens">
                  {paper.views.toLocaleString()}
                </p>
                <p
                  className="cc-analytics-paper-table__metric"
                  role="cell"
                  data-label="PDF downloads"
                >
                  {paper.pdfDownloads.toLocaleString()}
                </p>
                <p
                  className="cc-analytics-paper-table__metric"
                  role="cell"
                  data-label="Cite copies"
                >
                  {paper.citationCopies.toLocaleString()}
                </p>
                <p className="cc-analytics-paper-table__metric" role="cell" data-label="Avg time">
                  {formatTime(paper.avgReadTimeSec)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </AppCard>
    </section>
  );
}
