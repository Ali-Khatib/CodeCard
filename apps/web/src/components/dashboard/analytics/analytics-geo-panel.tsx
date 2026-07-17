'use client';

import { useState } from 'react';
import { CountUp } from '@/components/landing/count-up';
import { GlobeBars } from '@/components/ui/cobe-globe-bars';
import type { AnalyticsBundle } from '@/lib/dashboard/analytics-data';
import { AppCard, SectionLabel } from '../ui/dashboard-ui';
import { buildGeoMarkers } from './analytics-geo-markers';

export function AnalyticsGeoPanel({
  geo = [],
  topCountries,
  topCities,
}: {
  geo?: AnalyticsBundle['geo'];
  topCountries: AnalyticsBundle['topCountries'];
  topCities: AnalyticsBundle['topCities'];
}) {
  const markers = buildGeoMarkers(geo, topCities);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  return (
    <AppCard className="!p-6">
      <SectionLabel>Global visits</SectionLabel>
      <p className="mt-2 text-[14px] text-[var(--app-smoke)]">Where people open your CodeCard</p>

      <div className="mt-5">
        {markers.length > 0 ? (
          <div className="mx-auto w-full max-w-[520px] px-5 sm:px-10">
            <GlobeBars
              markers={markers}
              activeMarkerId={activeMarkerId}
              className="w-full"
            />
          </div>
        ) : (
          <div className="flex min-h-48 items-center justify-center text-center text-[14px] text-[var(--app-smoke)]">
            Location data will appear after visitors open your CodeCard.
          </div>
        )}

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
              {topCities.map((c) => {
                const marker = markers.find((candidate) => candidate.label === c.name);
                const active = marker?.id === activeMarkerId;
                return (
                  <li key={c.name} className="cc-analytics-geo-row">
                    <button
                      type="button"
                      disabled={!marker}
                      onClick={() => setActiveMarkerId(marker?.id ?? null)}
                      aria-pressed={active}
                      aria-label={`Locate ${c.name} on the globe`}
                      className={`rounded-md text-left text-[14px] transition-[color,transform,background] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-iris)] disabled:cursor-default ${
                        active
                          ? '-translate-y-0.5 bg-[var(--app-bone)] px-2 py-0.5 font-medium text-[var(--app-iris)]'
                          : 'text-[var(--app-ink)] hover:-translate-y-0.5 hover:text-[var(--app-iris)]'
                      }`}
                    >
                      {c.name}
                    </button>
                    <span className="text-[14px] font-medium tabular-nums text-[var(--app-smoke)]">
                      <CountUp value={c.visitors} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </AppCard>
  );
}
