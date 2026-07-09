'use client';

import { CountUp } from '@/components/landing/count-up';
import type { ResearchAnalyticsSummary } from '@/lib/dashboard/analytics-data';
import { AppCard, MetricLabel, SectionLabel } from '../ui/dashboard-ui';

function formatTime(sec: number) {
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return rem ? `${min}m ${rem}s` : `${min}m`;
}

export function AnalyticsResearchPanel({ summary }: { summary: ResearchAnalyticsSummary }) {
  return (
    <section>
      <SectionLabel>Research analytics</SectionLabel>
      <p className="mt-2 text-[14px] text-[var(--app-smoke)]">
        Paper views, PDF downloads, citation copies, and read-time signals.
      </p>

      <AppCard className="mt-5 !p-5 md:!p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="cc-analytics-stat-block">
            <MetricLabel>Research views</MetricLabel>
            <p className="mt-1 text-[22px] font-medium text-[var(--app-ink)]">
              <CountUp value={summary.views} />
            </p>
          </div>
          <div className="cc-analytics-stat-block">
            <MetricLabel>PDF downloads</MetricLabel>
            <p className="mt-1 text-[22px] font-medium text-[var(--app-ink)]">
              <CountUp value={summary.pdfDownloads} />
            </p>
          </div>
          <div className="cc-analytics-stat-block">
            <MetricLabel>Citation copies</MetricLabel>
            <p className="mt-1 text-[22px] font-medium text-[var(--app-ink)]">
              <CountUp value={summary.citationCopies} />
            </p>
          </div>
          <div className="cc-analytics-stat-block">
            <MetricLabel>Avg read time</MetricLabel>
            <p className="mt-1 text-[22px] font-medium text-[var(--app-ink)]">
              {formatTime(summary.avgReadTimeSec)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-bone)] p-4">
            <MetricLabel>Most viewed paper</MetricLabel>
            <p className="mt-2 text-[15px] font-medium leading-snug text-[var(--app-ink)]">
              {summary.mostViewedTitle}
            </p>
          </div>
          <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-bone)] p-4">
            <MetricLabel>Time spent per project</MetricLabel>
            <p className="mt-2 text-[22px] font-medium text-[var(--app-ink)]">
              {formatTime(summary.projectTimeSpentSec)}
            </p>
          </div>
          <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-bone)] p-4">
            <MetricLabel>Most engaged section</MetricLabel>
            <p className="mt-2 text-[22px] font-medium text-[var(--app-ink)]">
              {summary.mostEngagedProjectSection}
            </p>
          </div>
        </div>
      </AppCard>
    </section>
  );
}
