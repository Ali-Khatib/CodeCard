'use client';

import Link from 'next/link';
import type { AnalyticsTrendSeries } from '@/lib/dashboard/analytics-trends';
import { AppCard, SectionLabel } from '../ui/dashboard-ui';

export function AnalyticsTrendChart({
  trends,
  activeRange,
}: {
  trends: AnalyticsTrendSeries;
  activeRange: 7 | 30;
}) {
  const max = Math.max(
    ...trends.buckets.map(
      (b) => b.profileViews + b.projectViews + b.linkClicks,
    ),
    1,
  );

  return (
    <AppCard className="!p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionLabel>Daily activity</SectionLabel>
          <p className="mt-2 text-[14px] text-[var(--app-smoke)]">
            UTC calendar days · profile views, project views, and link clicks
          </p>
        </div>
        <div className="flex gap-2" role="tablist" aria-label="Trend range">
          {([7, 30] as const).map((days) => {
            const href = days === 7 ? '/dashboard/analytics?range=7' : '/dashboard/analytics?range=30';
            const selected = activeRange === days;
            return (
              <Link
                key={days}
                href={href}
                role="tab"
                aria-selected={selected}
                className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${
                  selected
                    ? 'bg-[var(--app-ink)] text-[var(--app-paper)]'
                    : 'border border-[var(--app-border)] text-[var(--app-smoke)] hover:text-[var(--app-ink)]'
                }`}
              >
                {days} days
              </Link>
            );
          })}
        </div>
      </div>

      <ul className="mt-6 space-y-2" aria-label={`${trends.range}-day activity`}>
        {trends.buckets.map((bucket) => {
          const value = bucket.profileViews + bucket.projectViews + bucket.linkClicks;
          const pct = (value / max) * 100;
          return (
            <li key={bucket.day} className="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-3">
              <span className="text-[12px] tabular-nums text-[var(--app-smoke)]">{bucket.label}</span>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--app-bone)]" aria-hidden>
                <div
                  className="h-full rounded-full bg-[var(--app-iris)]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-right text-[12px] tabular-nums text-[var(--app-ink)]">
                {value}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-[13px] text-[var(--app-smoke)]">
        Period totals · {trends.totals.profileViews} profile · {trends.totals.projectViews}{' '}
        project · {trends.totals.linkClicks} links · {trends.totals.profileShares} shares ·{' '}
        {trends.totals.qrDownloads} QR downloads
      </p>
    </AppCard>
  );
}
