'use client';

import { CountUp } from '@/components/landing/count-up';
import type { OwnerAnalyticsSummary } from '@/lib/dashboard/analytics-aggregate';
import { FadeInView } from './fade-in-view';
import {
  AppCard,
  MetricCard,
  MetricLabel,
  PageHeader,
  SectionLabel,
} from './ui/dashboard-ui';

function formatDuration(totalSec: number) {
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const rem = totalSec % 60;
  return rem ? `${min}m ${rem}s` : `${min}m`;
}

type DashboardAnalyticsViewProps = {
  summary: OwnerAnalyticsSummary;
  profileSlug?: string;
};

/**
 * Authenticated analytics — real owner aggregates only.
 * Preview/demo charts live in `preview-analytics-view.tsx`.
 */
export function DashboardAnalyticsView({
  summary,
  profileSlug,
}: DashboardAnalyticsViewProps) {
  const kpis = [
    { id: 'profile-views', label: 'Profile views', value: summary.profileViews },
    { id: 'project-views', label: 'Project views', value: summary.projectViews },
    { id: 'link-clicks', label: 'Link clicks', value: summary.linkClicks },
    { id: 'qr-downloads', label: 'QR downloads', value: summary.qrDownloads },
    { id: 'shares', label: 'Profile shares', value: summary.profileShares },
    { id: 'research-views', label: 'Research views', value: summary.researchViews },
  ];

  return (
    <div className="cc-app-page cc-app-page--1040 space-y-8">
      <PageHeader
        title="How your work is performing"
        description="Audience engagement from your public CodeCard — profile views, projects, research, shares, and time spent."
      />

      {!summary.isPublic && (
        <AppCard tone="meringue" className="!p-5">
          <p className="text-[15px] text-[var(--app-ink)]">
            Your profile is private. Public audience analytics stay at zero until you publish.
          </p>
        </AppCard>
      )}

      <FadeInView delay={0}>
        <AppCard tone="blush" className="!p-8">
          <MetricLabel>Profile views</MetricLabel>
          <p className="mt-4 text-[52px] font-medium tracking-[-0.03em] text-[var(--app-ink)] md:text-[62px]">
            <CountUp value={summary.profileViews} />
          </p>
          <p className="mt-2 text-[15px] text-[var(--app-smoke)]">
            Lifetime public profile views
          </p>
        </AppCard>
      </FadeInView>

      <FadeInView delay={0.04}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {kpis.map((kpi) => (
            <MetricCard
              key={kpi.id}
              label={kpi.label}
              value={<CountUp value={kpi.value} />}
            />
          ))}
        </div>
      </FadeInView>

      <FadeInView delay={0.08}>
        <div className="grid gap-4 sm:grid-cols-2">
          <AppCard className="!p-6">
            <MetricLabel>Project time spent</MetricLabel>
            <p className="mt-3 text-[28px] font-medium text-[var(--app-ink)]">
              {formatDuration(summary.projectTimeSpentSec)}
            </p>
            <p className="mt-2 text-[13px] text-[var(--app-smoke)]">
              Total active seconds recorded on published projects
            </p>
          </AppCard>
          <AppCard className="!p-6">
            <MetricLabel>Research time spent</MetricLabel>
            <p className="mt-3 text-[28px] font-medium text-[var(--app-ink)]">
              {formatDuration(summary.researchTimeSpentSec)}
            </p>
            <p className="mt-2 text-[13px] text-[var(--app-smoke)]">
              Total active seconds recorded on published papers
            </p>
          </AppCard>
        </div>
      </FadeInView>

      {summary.sources.length > 0 && (
        <FadeInView delay={0.12}>
          <section>
            <SectionLabel>How people reach you</SectionLabel>
            <p className="mt-2 text-[14px] text-[var(--app-smoke)]">
              Profile visit sources
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {summary.sources.map((s, i) => {
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
      )}

      <FadeInView delay={0.16}>
        <section>
          <SectionLabel>Top projects</SectionLabel>
          <p className="mt-2 text-[14px] text-[var(--app-smoke)]">
            Views, link clicks, and active time
          </p>
          {summary.topProjects.length === 0 ? (
            <AppCard className="mt-4 !p-5">
              <p className="text-[14px] text-[var(--app-smoke)]">
                No project engagement recorded yet.
              </p>
            </AppCard>
          ) : (
            <div className="mt-4 space-y-3">
              {summary.topProjects.map((project) => (
                <AppCard key={project.id} className="!p-5">
                  <h3 className="text-[17px] font-semibold text-[var(--app-ink)]">
                    {project.title}
                  </h3>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div>
                      <MetricLabel>Views</MetricLabel>
                      <p className="mt-1 text-[20px] font-medium">
                        <CountUp value={project.views} />
                      </p>
                    </div>
                    <div>
                      <MetricLabel>Link clicks</MetricLabel>
                      <p className="mt-1 text-[20px] font-medium">
                        <CountUp value={project.linkClicks} />
                      </p>
                    </div>
                    <div>
                      <MetricLabel>Time</MetricLabel>
                      <p className="mt-1 text-[20px] font-medium">
                        {formatDuration(project.timeSpentSec)}
                      </p>
                    </div>
                  </div>
                </AppCard>
              ))}
            </div>
          )}
        </section>
      </FadeInView>

      <FadeInView delay={0.2}>
        <section>
          <SectionLabel>Research</SectionLabel>
          <p className="mt-2 text-[14px] text-[var(--app-smoke)]">
            Paper views, PDFs, citations, and read time
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AppCard className="!p-4">
              <MetricLabel>Views</MetricLabel>
              <p className="mt-1 text-[22px] font-medium">
                <CountUp value={summary.researchViews} />
              </p>
            </AppCard>
            <AppCard className="!p-4">
              <MetricLabel>PDF downloads</MetricLabel>
              <p className="mt-1 text-[22px] font-medium">
                <CountUp value={summary.pdfDownloads} />
              </p>
            </AppCard>
            <AppCard className="!p-4">
              <MetricLabel>Citation copies</MetricLabel>
              <p className="mt-1 text-[22px] font-medium">
                <CountUp value={summary.citationCopies} />
              </p>
            </AppCard>
            <AppCard className="!p-4">
              <MetricLabel>Time spent</MetricLabel>
              <p className="mt-1 text-[22px] font-medium">
                {formatDuration(summary.researchTimeSpentSec)}
              </p>
            </AppCard>
          </div>
          {summary.topResearch.length > 0 && (
            <div className="mt-4 space-y-3">
              {summary.topResearch.map((paper) => (
                <AppCard key={paper.id} className="!p-5">
                  <h3 className="text-[16px] font-semibold text-[var(--app-ink)]">
                    {paper.title}
                  </h3>
                  <p className="mt-2 text-[13px] text-[var(--app-smoke)]">
                    {paper.views} views · {paper.pdfDownloads} PDFs · {paper.citationCopies}{' '}
                    citations · avg {formatDuration(paper.avgReadTimeSec)}
                  </p>
                </AppCard>
              ))}
            </div>
          )}
        </section>
      </FadeInView>

      {profileSlug && summary.isPublic && (
        <p className="text-[13px] text-[var(--app-smoke)]">
          Public profile:{' '}
          <a
            href={`/${profileSlug}`}
            className="font-medium text-[var(--app-iris)] underline-offset-2 hover:underline"
          >
            /{profileSlug}
          </a>
        </p>
      )}
    </div>
  );
}
