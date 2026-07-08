'use client';

import { CountUp } from '@/components/landing/count-up';
import type { GuestStats } from '@/lib/dashboard/analytics-data';
import { AppCard, MetricLabel, SectionLabel } from '../ui/dashboard-ui';

export function AnalyticsGuestStats({ stats }: { stats: GuestStats }) {
  return (
    <AppCard className="!p-6">
      <SectionLabel>Visitors</SectionLabel>
      <p className="mt-2 text-[14px] text-[var(--app-smoke)]">Signed-in vs guest traffic on your CodeCard</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="cc-analytics-stat-block">
          <MetricLabel>Guest visitors</MetricLabel>
          <p className="mt-2 text-[32px] font-medium tracking-[-0.03em] text-[var(--app-ink)]">
            <CountUp value={stats.guests} />
          </p>
          <p className="mt-1 text-[13px] text-[var(--app-smoke)]">{stats.guestPct}% of all visits</p>
        </div>
        <div className="cc-analytics-stat-block">
          <MetricLabel>Signed-in visitors</MetricLabel>
          <p className="mt-2 text-[32px] font-medium tracking-[-0.03em] text-[var(--app-ink)]">
            <CountUp value={stats.signedIn} />
          </p>
          <p className="mt-1 text-[13px] text-[var(--app-smoke)]">
            {100 - stats.guestPct}% with an account
          </p>
        </div>
      </div>

      <div className="cc-analytics-visitor-bar mt-6" aria-hidden>
        <span
          className="cc-analytics-visitor-bar__guest"
          style={{ width: `${stats.guestPct}%` }}
        />
        <span
          className="cc-analytics-visitor-bar__signed"
          style={{ width: `${100 - stats.guestPct}%` }}
        />
      </div>

      <p className="mt-4 text-[13px] text-[var(--app-smoke)]">
        <span className="font-medium text-[var(--app-ink)]">{stats.returningGuests.toLocaleString()}</span>{' '}
        returning guests ·{' '}
        <span className="font-medium text-[var(--app-ink)]">{stats.totalVisitors.toLocaleString()}</span>{' '}
        unique visitors total
      </p>
    </AppCard>
  );
}
