'use client';

import { useMemo, useState } from 'react';
import { CountUp } from '@/components/landing/count-up';
import {
  buildAnalyticsData,
  TIME_RANGE_LABELS,
  type TimeRange,
} from '@/lib/dashboard/analytics-data';
import { Sparkline } from './sparkline';
import { FadeInView } from './fade-in-view';
import { AnalyticsHumeChart } from './analytics/analytics-hume-chart';
import { AnalyticsAiInsights } from './analytics/analytics-ai-insights';
import { AnalyticsGuestStats } from './analytics/analytics-guest-stats';
import { AnalyticsGeoPanel } from './analytics/analytics-geo-panel';
import { AnalyticsProjectPanel } from './analytics/analytics-project-panel';
import { AnalyticsAudiencePanel } from './analytics/analytics-audience-panel';
import { AppCard, FilterBar, MetricCard, MetricLabel, PageHeader, SectionLabel } from './ui/dashboard-ui';

const RANGES: TimeRange[] = ['7d', '30d', '90d', 'lifetime'];

type DashboardAnalyticsViewProps = {
  displayName: string;
  profileViews?: number;
  projectViews?: number;
};

export function DashboardAnalyticsView({
  displayName,
  profileViews,
  projectViews,
}: DashboardAnalyticsViewProps) {
  const [range, setRange] = useState<TimeRange>('30d');
  const data = useMemo(
    () => buildAnalyticsData(range, { displayName, profileViews, projectViews }),
    [range, displayName, profileViews, projectViews],
  );

  const rangeLabels = RANGES.reduce(
    (acc, r) => ({ ...acc, [r]: TIME_RANGE_LABELS[r] }),
    {} as Record<TimeRange, string>,
  );

  const topKpis = data.kpis.slice(0, 4);

  return (
    <div className="cc-app-page cc-app-page--1040 space-y-8">
      <PageHeader
        title="How your work is performing"
        description="Reach, engagement, per-project depth, and who is viewing."
        actions={
          <FilterBar options={RANGES} value={range} onChange={setRange} labels={rangeLabels} />
        }
      />

      <FadeInView delay={0}>
        <AnalyticsAiInsights insights={data.insights} />
      </FadeInView>

      <FadeInView delay={0.04}>
        <AppCard tone="blush" className="!p-8">
          <MetricLabel>Profile reach</MetricLabel>
          <p className="mt-4 text-[52px] font-medium tracking-[-0.03em] text-[var(--app-ink)] md:text-[62px]">
            <CountUp key={range} value={data.profileReach} />
          </p>
          <p className="mt-2 text-[15px] text-[var(--app-smoke)]">
            people reached in the selected period
          </p>
          <p className="mt-3 text-[14px] font-medium text-[var(--app-iris)]">
            ↑ {data.reachChange}% this month
          </p>
        </AppCard>
      </FadeInView>

      <FadeInView delay={0.08}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {topKpis.map((kpi) => (
            <MetricCard
              key={kpi.id}
              label={kpi.label}
              value={<CountUp key={`${kpi.id}-${range}`} value={kpi.value} />}
              delta={`${kpi.trendUp ? '↑' : '↓'} ${Math.abs(kpi.change)}%`}
            >
              <Sparkline points={kpi.spark} className="mt-3 h-6 w-full opacity-60" />
            </MetricCard>
          ))}
        </div>
      </FadeInView>

      <FadeInView delay={0.12}>
        <div className="grid gap-4 lg:grid-cols-2">
          <AppCard className="!p-6">
            <AnalyticsHumeChart range={range} />
          </AppCard>
          <AnalyticsGuestStats stats={data.guestStats} />
        </div>
      </FadeInView>

      <FadeInView delay={0.16}>
        <AnalyticsGeoPanel
          topCountries={data.topCountries}
          topCities={data.topCities}
        />
      </FadeInView>

      <FadeInView delay={0.2}>
        <section>
          <SectionLabel>How people reach you</SectionLabel>
          <p className="mt-2 text-[14px] text-[var(--app-smoke)]">Traffic sources to your CodeCard</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.sources.map((s, i) => {
              const tones = ['blush', 'meringue', 'mint', 'seafoam', 'rose'] as const;
              return (
                <AppCard key={s.label} tone={tones[i % tones.length]} className="!p-4">
                  <p className="text-[14px] font-medium text-[var(--app-ink)]">{s.label}</p>
                  <p className="mt-2 text-[24px] font-medium tabular-nums">{s.pct}%</p>
                  <p className="mt-1 text-[13px] text-[var(--app-smoke)]">
                    {s.value.toLocaleString()} visits
                  </p>
                </AppCard>
              );
            })}
          </div>
        </section>
      </FadeInView>

      <FadeInView delay={0.24}>
        <AnalyticsProjectPanel projects={data.projectDetails} />
      </FadeInView>

      <FadeInView delay={0.28}>
        <AnalyticsAudiencePanel roles={data.roles} />
      </FadeInView>

      <FadeInView delay={0.32}>
        <AppCard>
          <SectionLabel>Recent activity</SectionLabel>
          <ul className="mt-4 divide-y divide-[var(--app-border)]">
            {data.activity.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-4 py-3 text-[14px]">
                <span className="text-[var(--app-ink)]">{event.text}</span>
                <time className="shrink-0 text-[13px] text-[var(--app-smoke)]">{event.time}</time>
              </li>
            ))}
          </ul>
        </AppCard>
      </FadeInView>
    </div>
  );
}
