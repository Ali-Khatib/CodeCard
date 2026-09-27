'use client';

import type { AnalyticsReview } from '@/lib/dashboard/analytics-review';
import { AppCard, SectionLabel } from '../ui/dashboard-ui';

export function AnalyticsAiInsights({
  insights,
  sample = false,
}: {
  insights: AnalyticsReview;
  sample?: boolean;
}) {
  return (
    <AppCard
      tone="meringue"
      className="!p-6 md:!p-8"
      data-analytics-review={sample ? 'sample' : 'live'}
    >
      <SectionLabel>{sample ? 'Sample review' : 'A read of your numbers'}</SectionLabel>
      <p className="mt-3 text-[17px] font-medium leading-snug text-[var(--app-ink)] md:text-[18px]">
        {insights.highlight}
      </p>
      {insights.moveUp ? (
        <div className="mt-5 rounded-[16px] border border-[var(--app-border)] bg-[var(--app-paper)] px-4 py-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--app-muted)]">
            Move this up
          </p>
          <p className="mt-1 text-[16px] font-semibold text-[var(--app-ink)]">
            {insights.moveUp.title}
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--app-smoke)]">
            {insights.moveUp.reason}
          </p>
        </div>
      ) : null}
      <div className="mt-5">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--app-muted)]">
          What the traffic means
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--app-smoke)]">
          {insights.trafficMeaning}
        </p>
      </div>
      {insights.lines.length > 0 ? (
        <ul className="mt-5 space-y-2.5">
          {insights.lines.map((line) => (
            <li
              key={line}
              className="flex gap-2.5 text-[14px] leading-relaxed text-[var(--app-smoke)]"
            >
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--app-iris)]" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </AppCard>
  );
}
