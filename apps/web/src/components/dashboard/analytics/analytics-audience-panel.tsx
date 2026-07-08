'use client';

import type { AudienceSlice } from '@/lib/dashboard/analytics-data';
import { AppCard, SectionLabel } from '../ui/dashboard-ui';

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

export function AnalyticsAudiencePanel({ roles }: { roles: AudienceSlice[] }) {
  return (
    <AppCard className="!p-6">
      <SectionLabel>Who is viewing</SectionLabel>
      <p className="mt-2 text-[14px] text-[var(--app-smoke)]">
        Inferred from profile signals, referrer context, and session behavior
      </p>

      <div className="mt-6 w-full">
        <SliceBars title="Roles" slices={roles} />
      </div>
    </AppCard>
  );
}
