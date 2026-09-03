'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CountUp } from '@/components/landing/count-up';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import type { ProfileLinkRow } from '@/lib/profile/profile-link-core';
import type { Profile } from '@codecard/types';
import { Sparkline } from './sparkline';
import { FadeInView } from './fade-in-view';
import { HomeIdentitySection } from './home-identity-section';
import { ProfileShareHero } from './profile-share-hero';
import type { OverviewContentSummary } from '@/lib/dashboard/overview-queries';
import type {
  OverviewCircleWork,
  OverviewCircleWorksEmpty,
} from '@/lib/dashboard/overview-circle-works';
import { EMPTY_STATE_COPY } from '@/lib/dashboard/empty-state-copy';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import type { ProfileCompletionResult } from '@/lib/profile/completion';
import {
  workspaceCreateProjectHref,
  workspaceCreateResearchHref,
  workspaceProjectEditHref,
  workspaceResearchEditHref,
  workspaceWorkHref,
} from '@/lib/marketing/demo-url';
import { AppButton, AppCard, AppMono, MetricCard } from './ui/dashboard-ui';
import { ProfileCompletionIndicator } from './profile-completion-indicator';
import { ContentOpeningLink } from '@/components/navigation/content-opening-transition';
import { InteractiveSurfaceCard } from '@/components/interactions/interactive-surface-card';

const SHARE_LINK_COPIED_FLAG = 'cc-share-link-copied';

export type OverviewReachStats = {
  profileViews: number;
  projectOpens: number;
  linkClicks: number;
  qrDownloads: number;
};

export type OverviewProps = {
  greeting: string;
  displayName: string;
  completion: ProfileCompletionResult;
  profileSlug?: string | null;
  avatarUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  profileViews?: number;
  links?: ProfileLinkItem[];
  profileLinks?: ProfileLinkRow[];
  profile?: Profile | null;
  preview?: boolean;
  /** Real owner aggregates, or null when the query failed. */
  stats: OverviewReachStats | null;
  /** True when reach stats could not be loaded (not the same as zero). */
  statsError?: boolean;
  /** Real project inventory, or null when the query failed. */
  projectsSummary: OverviewContentSummary | null;
  /** Real research inventory, or null when the query failed. */
  researchSummary: OverviewContentSummary | null;
  /** True when project/research inventory could not be loaded. */
  contentError?: boolean;
  /** Up to three latest Circle works for the Home glance. */
  circleWorks?: OverviewCircleWork[];
  /** Empty / error reason when circleWorks is empty. */
  circleWorksEmpty?: OverviewCircleWorksEmpty;
  suggested: { title: string; detail: string; href: string } | null;
  basePath?: string;
};

const PREVIEW_SPARKS: Record<'profileViews' | 'projectOpens', number[]> = {
  profileViews: [8, 12, 10, 16, 14, 18],
  projectOpens: [3, 6, 5, 9, 7, 11],
};

export function DashboardOverviewView({
  greeting,
  displayName,
  completion,
  profileSlug,
  profileViews,
  links = [],
  profileLinks = [],
  profile,
  preview = false,
  stats,
  statsError = false,
  projectsSummary,
  researchSummary,
  contentError = false,
  circleWorks = [],
  circleWorksEmpty = 'none',
  suggested,
  basePath = '/dashboard',
}: OverviewProps) {
  const { notifySuccess, notifyError } = useMutationFeedback();
  const firstName = displayName.split(' ')[0];
  const isProfilePublic = profile?.is_public === true;
  const views =
    typeof profileViews === 'number' ? profileViews : (stats?.profileViews ?? 0);
  const reachCards: { key: 'profileViews' | 'projectOpens'; label: string }[] = [
    { key: 'profileViews', label: 'Profile views' },
    { key: 'projectOpens', label: 'Project opens' },
  ];
  const circleHref = `${basePath}/circle`;

  useEffect(() => {
    const flag = sessionStorage.getItem(SHARE_LINK_COPIED_FLAG);
    if (!flag) return;
    sessionStorage.removeItem(SHARE_LINK_COPIED_FLAG);
    if (flag === '1') {
      notifySuccess(
        isProfilePublic
          ? MUTATION_FEEDBACK.share.linkCopied
          : MUTATION_FEEDBACK.share.linkCopiedButPrivate,
      );
    } else {
      notifyError(MUTATION_FEEDBACK.share.linkCopyFailed);
    }
    document.getElementById('share')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [notifySuccess, notifyError, isProfilePublic]);

  return (
    <div className="cc-profile-home">
      {/* ── Zone 1: Greeting strip ── */}
      <FadeInView delay={0}>
        <header className="cc-profile-home__greeting">
          <div>
            <p className="cc-app-mono">Home</p>
            <h1 className="cc-profile-home__title">
              {greeting}, {firstName}.
            </h1>
          </div>
          <div className="cc-profile-home__stat-pills">
            <span className="cc-profile-home__stat-pill cc-profile-home__stat-pill--iris">
              {preview ? (
                `Profile ${completion.percentage}% complete`
              ) : (
                <>
                  Profile <CountUp value={completion.percentage} />% complete
                </>
              )}
            </span>
            {!statsError && (
              <span className="cc-profile-home__stat-pill">
                {preview ? (
                  `${views.toLocaleString('en-US')} views`
                ) : (
                  <>
                    <CountUp value={views} />
                    {'\u00a0'}views
                  </>
                )}
              </span>
            )}
          </div>
        </header>
      </FadeInView>

      {/* ── Zone 2: Profile completion (hidden at 100%) ── */}
      {completion.percentage < 100 ? (
        <FadeInView delay={0.04}>
          <section aria-label="Profile completion">
            <ProfileCompletionIndicator completion={completion} />
          </section>
        </FadeInView>
      ) : null}

      {/* ── Suggested next step (high on the page) ── */}
      {suggested ? (
        <FadeInView delay={0.06}>
          <section className="cc-profile-home__zone" aria-label="Suggested next step">
            <AppCard tone="meringue" className="cc-profile-next-card cc-suggestion-card !p-6" reactive>
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="max-w-lg">
                  <AppMono>Suggested next step</AppMono>
                  <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-[var(--app-ink)]">
                    {suggested.title}
                  </h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--app-smoke)]">
                    {suggested.detail}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <AppButton variant="primary" href={suggested.href} className="cc-btn-pop-icon">
                    Do this now <span className="cc-btn-pop-icon__glyph" aria-hidden>→</span>
                  </AppButton>
                </div>
              </div>
            </AppCard>
          </section>
        </FadeInView>
      ) : null}

      <FadeInView delay={0.08}>
        <section id="share" aria-label="Share your CodeCard" className="scroll-mt-24">
          <ProfileShareHero
            profileSlug={profileSlug}
            profileId={profile?.id}
            isPublic={isProfilePublic}
            displayName={displayName}
          />
        </section>
      </FadeInView>

      {profile ? (
        <FadeInView delay={0.12}>
          <HomeIdentitySection
            profile={profile}
            profileLinks={profileLinks}
            links={links}
            preview={preview}
          />
        </FadeInView>
      ) : null}

      {/* ── Zone 5b: Real projects & research inventory ── */}
      <FadeInView delay={0.18}>
        <section className="cc-profile-home__zone" aria-label="Your work">
          <div className="cc-profile-home__zone-head">
            <div>
              <p className="cc-workspace-section__eyebrow">Your work</p>
              <h2 className="cc-workspace-section__title">Projects and research</h2>
            </div>
            <AppButton variant="ghost" href={workspaceWorkHref(basePath)}>
              Open Your Work →
            </AppButton>
          </div>
          {contentError || !projectsSummary || !researchSummary ? (
            <AppCard tone="meringue" className="!p-5">
              <p className="text-[15px] text-[var(--app-ink)]">
                Project and research summaries could not be loaded. Open Your Work to continue
                editing.
              </p>
            </AppCard>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <InteractiveSurfaceCard className="cc-app-card !p-5" lift parallax={false}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] text-[var(--app-smoke)]">Projects</p>
                    <p className="mt-1 text-[28px] font-medium tabular-nums text-[var(--app-ink)]">
                      <CountUp value={projectsSummary.total} />
                    </p>
                    <p className="mt-1 text-[13px] text-[var(--app-smoke)]">
                      {projectsSummary.published} published
                    </p>
                  </div>
                  <AppButton variant="ghost" href={workspaceWorkHref(basePath, 'projects')} className="cc-view-all-btn">
                    View all
                    <span className="cc-view-all-btn__arrow" aria-hidden>
                      →
                    </span>
                  </AppButton>
                </div>
                {projectsSummary.total === 0 ? (
                  <div className="mt-4">
                    <p className="text-[14px] text-[var(--app-smoke)]">
                      {EMPTY_STATE_COPY.home.noProjects}
                    </p>
                    <AppButton variant="primary" href={workspaceCreateProjectHref(basePath)} className="mt-3">
                      Add project
                    </AppButton>
                  </div>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {projectsSummary.recent.map((item) => {
                      const href = item.href.startsWith('/')
                        ? item.href
                        : workspaceProjectEditHref(basePath, item.id);
                      return (
                      <li key={item.id}>
                        <ContentOpeningLink
                          href={href}
                          kind="project"
                          itemTitle={item.title}
                          className="cc-overview-row flex items-center justify-between gap-3 rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-[14px] text-[var(--app-ink)]"
                        >
                          <span className="min-w-0 truncate font-medium">{item.title}</span>
                          <span className="shrink-0 text-[12px] text-[var(--app-smoke)]">
                            {item.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </ContentOpeningLink>
                      </li>
                      );
                    })}
                  </ul>
                )}
              </InteractiveSurfaceCard>

              <InteractiveSurfaceCard className="cc-app-card !p-5" lift parallax={false}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] text-[var(--app-smoke)]">Research</p>
                    <p className="mt-1 text-[28px] font-medium tabular-nums text-[var(--app-ink)]">
                      <CountUp value={researchSummary.total} />
                    </p>
                    <p className="mt-1 text-[13px] text-[var(--app-smoke)]">
                      {researchSummary.published} published
                    </p>
                  </div>
                  <AppButton variant="ghost" href={workspaceWorkHref(basePath, 'research')} className="cc-view-all-btn">
                    View all
                    <span className="cc-view-all-btn__arrow" aria-hidden>
                      →
                    </span>
                  </AppButton>
                </div>
                {researchSummary.total === 0 ? (
                  <div className="mt-4">
                    <p className="text-[14px] text-[var(--app-smoke)]">
                      {EMPTY_STATE_COPY.home.noResearch}
                    </p>
                    <AppButton variant="primary" href={workspaceCreateResearchHref(basePath)} className="mt-3">
                      Add paper
                    </AppButton>
                  </div>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {researchSummary.recent.map((item) => {
                      const href = item.href.startsWith('/')
                        ? item.href
                        : workspaceResearchEditHref(basePath, item.id);
                      return (
                      <li key={item.id}>
                        <ContentOpeningLink
                          href={href}
                          kind="research"
                          itemTitle={item.title}
                          className="cc-overview-row flex items-center justify-between gap-3 rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-[14px] text-[var(--app-ink)]"
                        >
                          <span className="min-w-0 truncate font-medium">{item.title}</span>
                          <span className="shrink-0 text-[12px] text-[var(--app-smoke)]">
                            {item.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </ContentOpeningLink>
                      </li>
                      );
                    })}
                  </ul>
                )}
              </InteractiveSurfaceCard>
            </div>
          )}
        </section>
      </FadeInView>

      {/* ── Zone 6: Quick glance (2 metrics) + Circle highlights ── */}
      <FadeInView delay={0.2}>
        <section className="cc-profile-home__zone" aria-label="Audience reach">
          <div className="cc-profile-home__zone-head">
            <div>
              <p className="cc-workspace-section__eyebrow">Your performance</p>
              <h2 className="cc-workspace-section__title">
                {preview ? 'This week at a glance' : 'Audience at a glance'}
              </h2>
            </div>
            <AppButton variant="ghost" href={`${basePath}/analytics`}>
              Full analytics →
            </AppButton>
          </div>
          {statsError || !stats ? (
            <AppCard tone="meringue" className="!p-5">
              <p className="text-[15px] text-[var(--app-ink)]">
                Reach stats could not be loaded. Try again shortly — profile editing and sharing still
                work.
              </p>
            </AppCard>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {reachCards.map((s) => {
                const count = Math.max(0, Math.round(stats[s.key] ?? 0));
                return (
                <MetricCard
                  key={s.key}
                  label={s.label}
                  value={
                    preview ? (
                      count.toLocaleString('en-US')
                    ) : (
                      <CountUp value={count} />
                    )
                  }
                >
                  {preview ? (
                    <Sparkline
                      points={PREVIEW_SPARKS[s.key]}
                      className="mt-3 h-8 w-full opacity-60"
                    />
                  ) : null}
                </MetricCard>
                );
              })}
            </div>
          )}
        </section>
      </FadeInView>

      <FadeInView delay={0.24}>
        <section className="cc-profile-home__zone cc-home-circle-glance" aria-label="From your Circle">
          <div className="cc-profile-home__zone-head">
            <div>
              <p className="cc-workspace-section__eyebrow">From your Circle</p>
              <h2 className="cc-workspace-section__title">Latest work nearby</h2>
            </div>
            <AppButton variant="ghost" href={circleHref}>
              Open Circle →
            </AppButton>
          </div>

          {circleWorks.length === 0 ? (
            <AppCard tone="meringue" className="!p-5">
              <p className="text-[15px] text-[var(--app-ink)]">
                {circleWorksEmpty === 'no_connections'
                  ? EMPTY_STATE_COPY.home.noCircleConnections
                  : circleWorksEmpty === 'error'
                    ? EMPTY_STATE_COPY.home.circleWorksError
                    : EMPTY_STATE_COPY.home.noCircleWorks}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {circleWorksEmpty === 'no_connections' ? (
                  <AppButton variant="primary" href={`${basePath}/connections`}>
                    Open Connections
                  </AppButton>
                ) : (
                  <AppButton variant="primary" href={circleHref}>
                    Open Circle
                  </AppButton>
                )}
              </div>
            </AppCard>
          ) : (
            <ul className="cc-home-circle-glance__list">
              {circleWorks.slice(0, 3).map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="cc-home-circle-glance__card">
                    <div className="cc-home-circle-glance__avatar">
                      {item.avatarUrl ? (
                        <Image
                          src={item.avatarUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <span aria-hidden>{item.personName[0]}</span>
                      )}
                    </div>
                    <div className="cc-home-circle-glance__copy min-w-0">
                      <p className="cc-home-circle-glance__person">
                        <span className="truncate">{item.personName}</span>
                        <span className="cc-home-circle-glance__when">{item.when}</span>
                      </p>
                      {item.personRole ? (
                        <p className="cc-home-circle-glance__role truncate">{item.personRole}</p>
                      ) : null}
                      <p className="cc-home-circle-glance__title truncate">
                        <span className="cc-home-circle-glance__kind">
                          {item.kind === 'research' ? 'Research' : 'Project'}
                        </span>
                        {item.title}
                      </p>
                      {item.tagline ? (
                        <p className="cc-home-circle-glance__tagline truncate">{item.tagline}</p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </FadeInView>
    </div>
  );
}
