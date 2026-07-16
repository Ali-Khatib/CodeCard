'use client';

import Image from 'next/image';
import { CountUp } from '@/components/landing/count-up';
import { getProfileLinkAria, resolveProfileLinkIcon } from '@/lib/icons/profile-links';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import { toSafeProfileLinkItems } from '@/lib/profile/safe-profile-link-url';
import type { Profile } from '@codecard/types';
import { Sparkline } from './sparkline';
import { ProfileShareHero } from './profile-share-hero';
import { FadeInView } from './fade-in-view';
import type { WorkspaceActivity } from '@/lib/dashboard/workspace-demo';
import type { OverviewContentSummary } from '@/lib/dashboard/overview-queries';
import type { ProfileCompletionResult } from '@/lib/profile/completion';
import { AppButton, AppCard, AppMono, MetricCard } from './ui/dashboard-ui';
import { ProfileCompletionIndicator } from './profile-completion-indicator';

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
  activity: WorkspaceActivity[];
  suggested: { title: string; detail: string; href: string } | null;
  basePath?: string;
};

const PREVIEW_SPARKS: Record<keyof OverviewReachStats, number[]> = {
  profileViews: [8, 12, 10, 16, 14, 18],
  projectOpens: [3, 6, 5, 9, 7, 11],
  linkClicks: [1, 2, 2, 4, 3, 5],
  qrDownloads: [2, 4, 3, 6, 5, 7],
};

export function DashboardOverviewView({
  greeting,
  displayName,
  completion,
  profileSlug,
  avatarUrl,
  headline,
  bio,
  profileViews,
  links = [],
  profile,
  preview = false,
  stats,
  statsError = false,
  projectsSummary,
  researchSummary,
  contentError = false,
  activity,
  suggested,
  basePath = '/dashboard',
}: OverviewProps) {
  const firstName = displayName.split(' ')[0];
  const views =
    typeof profileViews === 'number' ? profileViews : (stats?.profileViews ?? 0);
  const visibleLinks = toSafeProfileLinkItems(links);
  const reachCards: { key: keyof OverviewReachStats; label: string }[] = [
    { key: 'profileViews', label: 'Profile views' },
    { key: 'projectOpens', label: 'Project opens' },
    { key: 'linkClicks', label: 'Link clicks' },
    { key: 'qrDownloads', label: 'QR downloads' },
  ];

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
              Profile <CountUp value={completion.percentage} />% complete
            </span>
            {!statsError && (
              <span className="cc-profile-home__stat-pill">
                <CountUp value={views} /> views
              </span>
            )}
          </div>
        </header>
      </FadeInView>

      {/* ── Zone 2: Profile completion ── */}
      <FadeInView delay={0.04}>
        <section aria-label="Profile completion">
          <ProfileCompletionIndicator completion={completion} />
        </section>
      </FadeInView>

      {/* ── Zone 3: Share — copy link + QR (hero) ── */}
      <FadeInView delay={0.08}>
        <section aria-label="Share your CodeCard">
          <ProfileShareHero
            profileSlug={profileSlug}
            profileId={profile?.id}
            isPublic={profile?.is_public ?? true}
            displayName={displayName}
          />
        </section>
      </FadeInView>

      {/* ── Zone 4: Identity + edit ── */}
      <FadeInView delay={0.12}>
        <section id="profile" className="cc-profile-home__zone scroll-mt-24">
          <div className="cc-profile-home__zone-head">
            <div>
              <AppMono>Your card</AppMono>
              <h2 className="cc-profile-home__zone-title">How people see you</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <AppButton variant="ghost" href="/dashboard/profile">
                Edit profile
              </AppButton>
            </div>
          </div>

          <AppCard className="cc-profile-identity-card !p-0 overflow-hidden">
            <div className="cc-profile-identity-card__hero">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="" fill className="object-cover" sizes="80px" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-[var(--app-bone)] text-2xl font-medium">
                    {firstName[0]}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[26px] font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
                  {displayName}
                </h3>
                <p className="mt-1 break-words text-[15px] leading-relaxed text-[var(--app-smoke)]">{headline}</p>
                {profile?.location && (
                  <p className="mt-2 text-[14px] text-[var(--app-smoke)]">{profile.location}</p>
                )}
                {bio && (
                  <p className="mt-3 max-w-xl break-words text-[14px] leading-relaxed text-[var(--app-smoke)]">
                    {bio}
                  </p>
                )}
                {visibleLinks.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {visibleLinks.map((link) => {
                      const Icon = resolveProfileLinkIcon(link.type);
                      return (
                        <a
                          key={link.url + link.type}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={getProfileLinkAria(link.type, link.label)}
                          className="cc-profile-identity-card__social"
                        >
                          <Icon className="text-sm" aria-hidden />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </AppCard>
        </section>
      </FadeInView>

      {/* ── Zone 5: Do this next (single action card) ── */}
      {suggested ? (
        <FadeInView delay={0.16}>
          <section className="cc-profile-home__zone">
            <AppCard tone="rose" className="cc-profile-next-card !p-6">
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
                  <AppButton variant="primary" href={suggested.href}>
                    Do this now →
                  </AppButton>
                </div>
              </div>
            </AppCard>
          </section>
        </FadeInView>
      ) : null}

      {/* ── Zone 5b: Real projects & research inventory ── */}
      <FadeInView delay={0.18}>
        <section className="cc-profile-home__zone" aria-label="Your work">
          <div className="cc-profile-home__zone-head">
            <div>
              <AppMono>Your work</AppMono>
              <h2 className="cc-profile-home__zone-title">Projects and research</h2>
            </div>
          </div>
          {contentError || !projectsSummary || !researchSummary ? (
            <AppCard tone="rose" className="!p-5">
              <p className="text-[15px] text-[var(--app-ink)]">
                Project and research summaries could not be loaded. Open Projects or Research to
                continue editing.
              </p>
            </AppCard>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <AppCard className="!p-5">
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
                  <AppButton variant="ghost" href={`${basePath}/projects`}>
                    View all
                  </AppButton>
                </div>
                {projectsSummary.total === 0 ? (
                  <div className="mt-4">
                    <p className="text-[14px] text-[var(--app-smoke)]">
                      No projects yet. Create your first project to show on your CodeCard.
                    </p>
                    <AppButton variant="primary" href={`${basePath}/projects/new`} className="mt-3">
                      Add project
                    </AppButton>
                  </div>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {projectsSummary.recent.map((item) => (
                      <li key={item.id}>
                        <a
                          href={item.href.startsWith('/') ? item.href : `${basePath}/projects/${item.id}/edit`}
                          className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-[14px] text-[var(--app-ink)] hover:bg-[var(--app-bone)]"
                        >
                          <span className="min-w-0 truncate font-medium">{item.title}</span>
                          <span className="shrink-0 text-[12px] text-[var(--app-smoke)]">
                            {item.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </AppCard>

              <AppCard className="!p-5">
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
                  <AppButton variant="ghost" href={`${basePath}/research`}>
                    View all
                  </AppButton>
                </div>
                {researchSummary.total === 0 ? (
                  <div className="mt-4">
                    <p className="text-[14px] text-[var(--app-smoke)]">
                      No research papers yet. Add a paper when you are ready.
                    </p>
                    <AppButton variant="primary" href={`${basePath}/research/new`} className="mt-3">
                      Add paper
                    </AppButton>
                  </div>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {researchSummary.recent.map((item) => (
                      <li key={item.id}>
                        <a
                          href={
                            item.href.startsWith('/')
                              ? item.href
                              : `${basePath}/research/${item.id}/edit`
                          }
                          className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-[14px] text-[var(--app-ink)] hover:bg-[var(--app-bone)]"
                        >
                          <span className="min-w-0 truncate font-medium">{item.title}</span>
                          <span className="shrink-0 text-[12px] text-[var(--app-smoke)]">
                            {item.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </AppCard>
            </div>
          )}
        </section>
      </FadeInView>

      {/* ── Zone 6: Reach snapshot ── */}
      <FadeInView delay={0.2}>
        <section className="cc-profile-home__zone" aria-label="Audience reach">
          <div className="cc-profile-home__zone-head">
            <div>
              <AppMono>Reach</AppMono>
              <h2 className="cc-profile-home__zone-title">
                {preview ? 'This week at a glance' : 'Audience at a glance'}
              </h2>
            </div>
            <AppButton variant="ghost" href={`${basePath}/analytics`}>
              Full analytics →
            </AppButton>
          </div>
          {statsError || !stats ? (
            <AppCard tone="rose" className="!p-5">
              <p className="text-[15px] text-[var(--app-ink)]">
                Reach stats could not be loaded. Try again shortly — profile editing and sharing still
                work.
              </p>
            </AppCard>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {reachCards.map((s) => (
                <MetricCard key={s.key} label={s.label} value={<CountUp value={stats[s.key]} />}>
                  {preview ? (
                    <Sparkline
                      points={PREVIEW_SPARKS[s.key]}
                      className="mt-3 h-8 w-full opacity-60"
                    />
                  ) : null}
                </MetricCard>
              ))}
            </div>
          )}
        </section>
      </FadeInView>

      {/* ── Zone 7: Activity ── */}
      <FadeInView delay={0.24}>
        <section className="cc-profile-home__zone" aria-label="Recent activity">
          <AppMono>Recent activity</AppMono>
          {activity.length === 0 ? (
            <p className="mt-4 text-[14px] text-[var(--app-smoke)]">
              Activity will appear here as people engage with your public CodeCard.
            </p>
          ) : (
            <ul className="cc-profile-activity-list mt-4">
              {activity.slice(0, 5).map((item) => (
                <li key={item.id} className="cc-profile-activity-list__item">
                  <span>{item.text}</span>
                  <time>{item.time}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </FadeInView>
    </div>
  );
}
