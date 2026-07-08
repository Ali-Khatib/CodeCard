'use client';

import { CountUp } from '@/components/landing/count-up';
import type { AnalyticsBundle } from '@/lib/dashboard/analytics-data';
import { AppCard, SectionLabel } from '../ui/dashboard-ui';
import { AnalyticsGeoChart } from './analytics-geo-chart';

export function AnalyticsGeoPanel({
  topCountries,
  topCities,
}: {
  geo?: AnalyticsBundle['geo'];
  topCountries: AnalyticsBundle['topCountries'];
  topCities: AnalyticsBundle['topCities'];
}) {
  return (
    <AppCard className="!p-6">
      <SectionLabel>Global visits</SectionLabel>
      <p className="mt-2 text-[14px] text-[var(--app-smoke)]">Where people open your CodeCard</p>

      <div className="mt-5">
        <AnalyticsGeoChart cities={topCities} />

        <div className="mt-6 grid gap-8 border-t border-[var(--app-border)] pt-5 sm:grid-cols-2">
          <div>
            <p className="text-[13px] font-medium text-[var(--app-ink)]">Top countries</p>
            <ul className="mt-3 space-y-2">
              {topCountries.map((c) => (
                <li key={c.name} className="cc-analytics-geo-row">
                  <span className="text-[14px] text-[var(--app-ink)]">{c.name}</span>
                  <span className="text-[14px] font-medium tabular-nums text-[var(--app-smoke)]">
                    {c.pct}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-medium text-[var(--app-ink)]">Top cities</p>
            <ul className="mt-3 space-y-2">
              {topCities.map((c) => (
                <li key={c.name} className="cc-analytics-geo-row">
                  <span className="text-[14px] text-[var(--app-ink)]">{c.name}</span>
                  <span className="text-[14px] font-medium tabular-nums text-[var(--app-smoke)]">
                    <CountUp value={c.visitors} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppCard>
  );
}
