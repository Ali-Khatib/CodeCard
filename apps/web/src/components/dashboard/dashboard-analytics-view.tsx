'use client';

import { CountUp } from '@/components/landing/count-up';
import type { OwnerAnalyticsSummary } from '@/lib/dashboard/analytics-aggregate';
import type { AnalyticsTrendSeries } from '@/lib/dashboard/analytics-trends';
import type { AnalyticsEntitlement } from '@/lib/dashboard/analytics-entitlement';
import {
  ANALYTICS_ACCURACY_DISCLOSURE_BODY,
  ANALYTICS_ACCURACY_DISCLOSURE_DETAILS,
  ANALYTICS_ACCURACY_DISCLOSURE_HEADLINE,
} from '@/lib/dashboard/analytics-accuracy-disclosure';
import { FadeInView } from './fade-in-view';
import { AnalyticsTrendChart } from './analytics/analytics-trend-chart';
import {
  AppButton,
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
  trends: AnalyticsTrendSeries;
  profileSlug?: string;
  entitlement: AnalyticsEntitlement;
};

/** Shown where a Pro-only section would be. The data is never sent on Free. */
function ProUpgradeCard({ title, body }: { title: string; body: string }) {
  return (
    <AppCard className="mt-4 !border-[var(--app-border-strong)] !p-6" data-analytics-pro-locked>
      <p className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--app-ink)]">{title}</p>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--app-muted)]">{body}</p>
      <AppButton variant="soft" href="/dashboard/billing" className="mt-4">
        Upgrade to unlock
      </AppButton>
    </AppCard>
  );
}

/**
 * Authenticated analytics — real owner aggregates only.
 * Sample preview charts are isolated to the preview analytics route.
 */
export function DashboardAnalyticsView({
  summary,
  trends,
  profileSlug,
  entitlement,
}: DashboardAnalyticsViewProps) {
  const kpis = [
    { id: 'profile-views', label: 'Profile views', value: summary.profileViews },
    { id: 'project-views', label: 'Project views', value: summary.projectViews },
    { id: 'link-clicks', label: 'Link clicks', value: summary.linkClicks },
    { id: 'qr-downloads', label: 'QR downloads', value: summary.qrDownloads },
    { id: 'shares', label: 'Profile shares', value: summary.profileShares },
    { id: 'research-views', label: 'Research views', value: summary.researchViews },
  ];
  const isZeroState = !summary.hasAnyEvents;
  const publicHref = profileSlug ? `/${profileSlug}` : null;

  return (
    <div className="cc-app-page cc-app-page--1040 space-y-8">
      <PageHeader
        title="How your work is performing"
        description={
          isZeroState
            ? 'Analytics appear after people engage with your public CodeCard.'
            : 'Audience engagement from your public CodeCard — profile views, projects, research, shares, and time spent.'
        }
      />

      {!summary.isPublic && (
        <div role="status">
          <AppCard tone="meringue" className="!p-5">
            <h2 className="text-[16px] font-medium text-[var(--app-ink)]">Profile is private</h2>
            <p className="mt-2 text-[15px] text-[var(--app-smoke)]">
              Public audience analytics stay at zero until you publish your CodeCard.
            </p>
            <AppButton variant="ghost" href="/dashboard/profile" className="mt-3">
              Open profile settings
            </AppButton>
          </AppCard>
        </div>
      )}

      {isZeroState && summary.isPublic && (
        <div role="status">
          <AppCard tone="seafoam" className="!p-6">
            <h2 className="text-[18px] font-medium text-[var(--app-ink)]">No audience activity yet</h2>
            <p className="mt-2 max-w-xl text-[15px] text-[var(--app-smoke)]">
              Totals below are real zeros — not sample data. They update when visitors view your
              profile, open projects, click links, share, or download your QR code.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {publicHref ? (
                <AppButton variant="primary" href={publicHref}>
                  View public profile
                </AppButton>
              ) : null}
              <AppButton variant="ghost" href="/dashboard">
                Share from home
              </AppButton>
            </div>
          </AppCard>
        </div>
      )}

      <FadeInView delay={0}>
        <AppCard tone="meringue" className="!p-8">
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

      <FadeInView delay={0.06}>
        <AnalyticsTrendChart
          trends={trends}
          activeRange={trends.range}
          hasLifetimeEvents={summary.hasAnyEvents}
        />
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

      <FadeInView delay={0.12}>
        <section>
          <SectionLabel>Top projects</SectionLabel>
          <p className="cc-app-section-subtitle">
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
                <AppCard key={project.id} className="cc-analytics-project-card !p-5">
                  <h3 className="cc-analytics-project-card__title !text-[clamp(20px,2.4vw,24px)]">
                    {project.title}
                  </h3>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="cc-analytics-project-metric">
                      <MetricLabel>Views</MetricLabel>
                      <p className="cc-analytics-project-metric__value !text-[22px]">
                        <CountUp value={project.views} />
                      </p>
                    </div>
                    <div className="cc-analytics-project-metric">
                      <MetricLabel>Link clicks</MetricLabel>
                      <p className="cc-analytics-project-metric__value !text-[22px]">
                        <CountUp value={project.linkClicks} />
                      </p>
                    </div>
                    <div className="cc-analytics-project-metric">
                      <MetricLabel>Time</MetricLabel>
                      <p className="cc-analytics-project-metric__value !text-[22px]">
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
          <p className="cc-app-section-subtitle">
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
          {!entitlement.perResearchPaper ? (
            <ProUpgradeCard
              title="Per research paper analytics"
              body="Break these totals down paper by paper — views, PDF downloads, citations, and average read time."
            />
          ) : summary.topResearch.length === 0 ? (
            <AppCard className="mt-4 !p-5">
              <p className="text-[14px] text-[var(--app-smoke)]">
                No research engagement recorded yet.
              </p>
            </AppCard>
          ) : (
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

      <footer
        className="border-t border-[rgba(35,35,36,0.08)] pt-5"
        aria-label="Analytics accuracy"
      >
        <p className="text-[14px] font-medium text-[var(--app-ink)]">
          {ANALYTICS_ACCURACY_DISCLOSURE_HEADLINE}
        </p>
        <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-[var(--app-muted)]">
          {ANALYTICS_ACCURACY_DISCLOSURE_BODY}
        </p>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[var(--app-muted)]">
          {ANALYTICS_ACCURACY_DISCLOSURE_DETAILS}
        </p>
      </footer>
    </div>
  );
}
