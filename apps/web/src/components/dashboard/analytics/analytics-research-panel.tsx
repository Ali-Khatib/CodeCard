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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionLabel>Research analytics</SectionLabel>
          <p className="mt-2 text-[14px] text-[var(--app-smoke)]">
            Paper views, PDF downloads, citation copies, and read-time signals.
          </p>
        </div>
        <span className="rounded-full border border-[var(--app-border-strong)] bg-[var(--app-bone)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--app-iris)]">
          Pro
        </span>
      </div>

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

        <div className="mt-6 rounded-[22px] border border-[var(--app-border)] bg-[linear-gradient(135deg,rgba(192,148,228,0.1),rgba(255,249,243,0.86))] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <MetricLabel>Per research paper analytics</MetricLabel>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--app-smoke)]">
                Pro breakdown for each paper: reads, PDF intent, citation intent, and strongest engagement signal.
              </p>
            </div>
            <span className="rounded-full bg-[var(--app-paper)] px-3 py-1 text-[11px] font-semibold text-[var(--app-iris)] shadow-[0_8px_20px_rgba(34,34,34,0.05)]">
              Pro feature
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {summary.perPaper.map((paper) => (
              <article
                key={paper.id}
                className="grid gap-3 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-paper)] p-4 md:grid-cols-[minmax(0,1.35fr)_repeat(4,minmax(92px,0.55fr))]"
              >
                <div className="min-w-0">
                  <p className="cc-fit-title cc-work-title cc-work-title--compact !text-[clamp(1.25rem,2vw,1.7rem)]">
                    {paper.title}
                  </p>
                  <p className="mt-1 text-[12px] text-[var(--app-smoke)]">
                    Top signal: {paper.topSignal}
                  </p>
                </div>
                <MiniPaperMetric label="Views" value={paper.views.toLocaleString()} />
                <MiniPaperMetric label="PDFs" value={paper.pdfDownloads.toLocaleString()} />
                <MiniPaperMetric label="Citations" value={paper.citationCopies.toLocaleString()} />
                <MiniPaperMetric label="Avg read" value={formatTime(paper.avgReadTimeSec)} />
              </article>
            ))}
          </div>
        </div>
      </AppCard>
    </section>
  );
}

function MiniPaperMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-[var(--app-border)] bg-[var(--app-bone)] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--app-smoke)]">{label}</p>
      <p className="mt-1 text-[16px] font-semibold text-[var(--app-ink)]">{value}</p>
    </div>
  );
}
