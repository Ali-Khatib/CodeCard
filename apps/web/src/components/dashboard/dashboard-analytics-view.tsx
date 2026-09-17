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
import { EMPTY_STATE_COPY } from '@/lib/dashboard/empty-state-copy';
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
  const isZeroState = !summary.hasAnyEvents;
  const publicHref = profileSlug ? `/${profileSlug}` : null;
  const copy = EMPTY_STATE_COPY.analytics;

  return (
    <div className="cc-app-page cc-app-page--1040 space-y-8">
      <PageHeader
        title="Analytics"
        description={
          isZeroState
            ? copy.description
            : 'How much attention your CodeCard is getting, and what people are opening.'
        }
      />

      {!summary.isPublic && (
        <div role="status">
          <AppCard tone="meringue" className="!p-5">
            <h2 className="text-[16px] font-medium text-[var(--app-ink)]">Profile is private</h2>
            <p className="mt-2 text-[15px] text-[var(--app-smoke)]">
              Public audience analytics stay at zero until you publish your CodeCard.
            </p>
            <AppButton variant="ghost" href="/dashboard#profile" className="mt-3">
              Open profile settings
            </AppButton>
          </AppCard>
        </div>
      )}

      {isZeroState && summary.isPublic ? (
        <div role="status">
          <AppCard tone="seafoam" className="!p-6">
            <h2 className="text-[18px] font-medium text-[var(--app-ink)]">{copy.title}</h2>
            <p className="mt-2 max-w-xl text-[15px] text-[var(--app-smoke)]">
              {copy.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {publicHref ? (
                <AppButton variant="primary" href={publicHref}>
                  {copy.viewCta}
                </AppButton>
              ) : null}
              <AppButton variant="ghost" href="/dashboard#share">
                {copy.shareCta}
              </AppButton>
            </div>
          </AppCard>
        </div>
      ) : null}

      {!isZeroState ? (
        <>
          <FadeInView delay={0}>
            <AppCard tone="meringue" className="!p-8">
              <MetricLabel>CodeCard views</MetricLabel>
              <p className="mt-4 text-[52px] font-medium tracking-[-0.03em] text-[var(--app-ink)] md:text-[62px]">
                <CountUp value={summary.profileViews} />
              </p>
              <p className="mt-2 text-[15px] text-[var(--app-smoke)]">
                Recorded public CodeCard views in the retained event window
              </p>
            </AppCard>
          </FadeInView>

          <FadeInView delay={0.04}>
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                label="Project views"
                value={<CountUp value={summary.projectViews} />}
              />
              <MetricCard
                label="Research views"
                value={<CountUp value={summary.researchViews} />}
              />
              <MetricCard
                label="Link clicks"
                value={<CountUp value={summary.linkClicks} />}
              />
            </div>
          </FadeInView>

          <FadeInView delay={0.06}>
            <AnalyticsTrendChart
              trends={trends}
              activeRange={trends.range}
              hasLifetimeEvents={summary.hasAnyEvents}
            />
          </FadeInView>

          <FadeInView delay={0.12}>
            <section>
              <SectionLabel>What people open</SectionLabel>
              <p className="cc-app-section-subtitle">Most viewed projects from recorded events</p>
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
                Paper opens, PDF downloads, and citation copies
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <AppCard className="!p-4">
                  <MetricLabel>Paper opens</MetricLabel>
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
                  <MetricLabel>Cite copies</MetricLabel>
                  <p className="mt-1 text-[22px] font-medium">
                    <CountUp value={summary.citationCopies} />
                  </p>
                </AppCard>
              </div>
              {!entitlement.perResearchPaper ? (
                <ProUpgradeCard
                  title="Per research paper analytics"
                  body="Break these totals down paper by paper — opens, PDF downloads, citation copies, and average read time."
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
                        {paper.views} opens · {paper.pdfDownloads} PDF downloads ·{' '}
                        {paper.citationCopies} cite copies · avg{' '}
                        {formatDuration(paper.avgReadTimeSec)}
                      </p>
                    </AppCard>
                  ))}
                </div>
              )}
            </section>
          </FadeInView>

          <FadeInView delay={0.24}>
            <section>
              <SectionLabel>How people reach you</SectionLabel>
              <p className="cc-app-section-subtitle">
                Recorded open sources from your public CodeCard
              </p>
              {!entitlement.visitorInsights ? (
                <ProUpgradeCard
                  title="How people reach you"
                  body="See whether visitors arrived from a QR scan, a direct link, or another recorded source."
                />
              ) : summary.sources.length === 0 ? (
                <AppCard className="mt-4 !p-5">
                  <p className="text-[14px] text-[var(--app-smoke)]">
                    No source breakdown recorded yet.
                  </p>
                </AppCard>
              ) : (
                <ul className="mt-4 space-y-3">
                  {summary.sources.map((source) => (
                    <li key={source.label}>
                      <AppCard className="flex items-center justify-between gap-4 !p-5">
                        <div>
                          <p className="text-[16px] font-medium text-[var(--app-ink)]">
                            {source.label}
                          </p>
                          <p className="mt-1 text-[13px] text-[var(--app-smoke)]">
                            {source.value} opens · {source.pct}%
                          </p>
                        </div>
                      </AppCard>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </FadeInView>
        </>
      ) : null}

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
