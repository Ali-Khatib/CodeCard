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
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionLabel>Research analytics</SectionLabel>
          <SectionSubtitle>
            Paper views, PDF downloads, citation copies, and read-time signals.
          </SectionSubtitle>
        </div>
      </div>

      <AppCard className="mt-5 !p-5 md:!p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="cc-analytics-stat-block">
            <MetricLabel>Research views</MetricLabel>
            <p className="mt-1 text-[clamp(22px,2.4vw,28px)] font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
              <CountUp value={summary.views} />
            </p>
          </div>
          <div className="cc-analytics-stat-block">
            <MetricLabel>PDF downloads</MetricLabel>
            <p className="mt-1 text-[clamp(22px,2.4vw,28px)] font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
              <CountUp value={summary.pdfDownloads} />
            </p>
          </div>
          <div className="cc-analytics-stat-block">
            <MetricLabel>Citation copies</MetricLabel>
            <p className="mt-1 text-[clamp(22px,2.4vw,28px)] font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
              <CountUp value={summary.citationCopies} />
            </p>
          </div>
          <div className="cc-analytics-stat-block">
            <MetricLabel>Avg read time</MetricLabel>
            <p className="mt-1 text-[clamp(22px,2.4vw,28px)] font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
              {formatTime(summary.avgReadTimeSec)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 border-t border-[var(--app-border)] pt-5 md:grid-cols-3">
          <div>
            <MetricLabel>Most viewed paper</MetricLabel>
            <p className="mt-2 text-[15px] font-medium leading-snug text-[var(--app-ink)]">
              {summary.mostViewedTitle}
            </p>
          </div>
          <div>
            <MetricLabel>Time spent per project</MetricLabel>
            <p className="mt-2 text-[clamp(22px,2.4vw,28px)] font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
              {formatTime(summary.projectTimeSpentSec)}
            </p>
          </div>
          <div>
            <MetricLabel>Most engaged section</MetricLabel>
            <p className="mt-2 text-[clamp(22px,2.4vw,28px)] font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
              {summary.mostEngagedProjectSection}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-[var(--app-border)] pt-5">
          <div>
            <MetricLabel>Per research paper</MetricLabel>
            <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-[var(--app-muted)]">
              Reads, PDF intent, citation intent, and strongest engagement signal for each paper.
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            {summary.perPaper.map((paper) => (
              <article
                key={paper.id}
                className="grid gap-3 border-b border-[var(--app-border)] py-4 last:border-b-0 md:grid-cols-[minmax(0,1.35fr)_repeat(4,minmax(92px,0.55fr))]"
              >
                <div className="min-w-0">
                  <p className="cc-fit-title cc-work-title cc-work-title--compact !text-[clamp(1.25rem,2vw,1.7rem)]">
                    {paper.title}
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--app-muted)]">
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
    <div className="min-w-0 px-1 py-1">
      <p className="text-[12px] font-semibold tracking-[-0.01em] text-[var(--app-muted)]">{label}</p>
      <p className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-[var(--app-ink)]">{value}</p>
    </div>
  );
}
