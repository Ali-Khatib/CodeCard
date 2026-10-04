'use client';

import type { AudienceSlice } from '@/lib/dashboard/analytics-data';
import { AppCard, SectionLabel, SectionSubtitle } from '../ui/dashboard-ui';

function SliceBars({ title, slices }: { title: string; slices: AudienceSlice[] }) {
  return (
    <div className="w-full">
      <p className="text-[13px] font-medium text-[var(--app-ink)]">{title}</p>
      <ul className="mt-3 space-y-3">
        {slices.map((slice) => (
          <li key={slice.label} className="w-full">
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <span className="text-[var(--app-ink)]">{slice.label}</span>
              <span className="shrink-0 font-medium tabular-nums text-[var(--app-smoke)]">
                {slice.pct}%
              </span>
            </div>
            <div className="cc-analytics-slice-track mt-1.5 w-full">
              <span className="cc-analytics-slice-bar" style={{ width: `${slice.pct}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AnalyticsAudiencePanel({
  roles,
  description = 'Share of profile views from signed-in people who said what they are.',
  emptyLabel,
}: {
  roles: AudienceSlice[];
  description?: string;
  emptyLabel?: string;
}) {
  return (
    <AppCard className="!p-6">
      <SectionLabel>Who is viewing</SectionLabel>
      <SectionSubtitle>{description}</SectionSubtitle>

      <div className="mt-6 w-full">
        {emptyLabel ? (
          <p className="text-[14px] leading-relaxed text-[var(--app-smoke)]">{emptyLabel}</p>
        ) : (
          <SliceBars title="Roles" slices={roles} />
        )}
      </div>
    </AppCard>
  );
}
