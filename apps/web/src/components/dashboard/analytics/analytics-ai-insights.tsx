'use client';

import type { AnalyticsBundle } from '@/lib/dashboard/analytics-data';
import { AppCard, SectionLabel } from '../ui/dashboard-ui';

export function AnalyticsAiInsights({ insights }: { insights: AnalyticsBundle['insights'] }) {
  return (
    <AppCard tone="blush" className="!p-6 md:!p-8">
      <SectionLabel>AI insight</SectionLabel>
      <p className="mt-3 text-[17px] font-medium leading-snug text-[var(--app-ink)] md:text-[18px]">
        {insights.highlight}
      </p>
      <ul className="mt-5 space-y-2.5">
        {insights.lines.map((line) => (
          <li key={line} className="flex gap-2.5 text-[14px] leading-relaxed text-[var(--app-smoke)]">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--app-iris)]" aria-hidden />
            {line}
          </li>
        ))}
      </ul>
    </AppCard>
  );
}
