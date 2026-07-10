'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { CountUp } from '@/components/landing/count-up';
import { ProfileEditor } from '@/components/profile-editor';
import { getProfileLinkAria, resolveProfileLinkIcon } from '@/lib/icons/profile-links';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import type { Profile } from '@codecard/types';
import { Sparkline } from './sparkline';
import { ProfileShareHero } from './profile-share-hero';
import { FadeInView } from './fade-in-view';
import type { WorkspaceActivity } from '@/lib/dashboard/workspace-demo';
import { AppButton, AppCard, AppMono, MetricCard } from './ui/dashboard-ui';

const EASE = [0.22, 1, 0.36, 1] as const;

export type OverviewProps = {
  greeting: string;
  displayName: string;
  completion: number;
  profileSlug?: string | null;
  avatarUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  profileViews?: number;
  links?: ProfileLinkItem[];
  profile?: Profile | null;
  preview?: boolean;
  stats: {
    profileViews: number;
    projectOpens: number;
    saves: number;
    qrScans: number;
  };
  activity: WorkspaceActivity[];
  suggested: { title: string; detail: string; href: string };
  basePath?: string;
};

export function DashboardOverviewView({
  greeting,
  displayName,
  completion,
  profileSlug,
  avatarUrl,
  headline,
  bio,
  profileViews = 0,
  links = [],
  profile,
  preview = false,
  stats,
  activity,
  suggested,
  basePath = '/dashboard',
}: OverviewProps) {
  const firstName = displayName.split(' ')[0];
  const [editing, setEditing] = useState(false);
  const [company, setCompany] = useState('Stripe');
  const [location, setLocation] = useState('San Francisco');
  const reduced = useReducedMotion() ?? false;
  const views = profileViews || stats.profileViews;

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
              <CountUp value={completion} />% ready
            </span>
            <span className="cc-profile-home__stat-pill">
              <CountUp value={views} /> views
            </span>
          </div>
        </header>
      </FadeInView>

      {/* ── Zone 2: Share — copy link + QR (hero) ── */}
      <FadeInView delay={0.04}>
        <section aria-label="Share your CodeCard">
          <ProfileShareHero profileSlug={profileSlug} />
        </section>
      </FadeInView>

      {/* ── Zone 3: Identity + edit ── */}
      <FadeInView delay={0.08}>
        <section id="profile" className="cc-profile-home__zone scroll-mt-24">
          <div className="cc-profile-home__zone-head">
            <div>
              <AppMono>Your card</AppMono>
              <h2 className="cc-profile-home__zone-title">How people see you</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <AppButton
                variant={editing ? 'primary' : 'ghost'}
                onClick={() => setEditing((e) => !e)}
              >
                {editing ? 'Done editing' : 'Edit profile'}
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
                {bio && !editing && (
                  <p className="mt-3 max-w-xl break-words text-[14px] leading-relaxed text-[var(--app-smoke)]">
                    {bio}
                  </p>
                )}
                {links.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {links.map((link) => {
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

            <AnimatePresence initial={false}>
              {editing && (
                <motion.div
                  id="profile-edit"
                  className="cc-profile-identity-card__editor scroll-mt-24 overflow-hidden"
                  initial={reduced ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reduced ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  <div className="space-y-5 border-t border-[var(--app-border)] p-6">
                    <div className="flex items-center gap-4">
                      <AppButton variant="ghost">Change photo</AppButton>
                      <span className="text-[13px] text-[var(--app-smoke)]">
                        {company} · {location}
                      </span>
                    </div>

                    {!preview && profile ? (
                      <ProfileEditor profile={profile} />
                    ) : (
                      <div className="space-y-4">
                        <label className="block">
                          <span className="cc-app-mono">Display name</span>
                          <input className="cc-app-input mt-2" defaultValue={displayName} readOnly={preview} />
                        </label>
                        <label className="block">
                          <span className="cc-app-mono">Headline</span>
                          <input className="cc-app-input mt-2" defaultValue={headline ?? ''} readOnly={preview} />
                        </label>
                        <label className="block">
                          <span className="cc-app-mono">Bio</span>
                          <textarea
                            className="cc-app-input mt-2 min-h-[96px] resize-y"
                            defaultValue={bio ?? ''}
                            readOnly={preview}
                          />
                        </label>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="cc-app-mono">Company</span>
                        <input
                          className="cc-app-input mt-2"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          disabled={preview}
                        />
                      </label>
                      <label className="block">
                        <span className="cc-app-mono">Location</span>
                        <input
                          className="cc-app-input mt-2"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          disabled={preview}
                        />
                      </label>
                    </div>

                    {!preview && (
                      <AppButton variant="primary" onClick={() => setEditing(false)}>
                        Save changes
                      </AppButton>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </AppCard>
        </section>
      </FadeInView>

      {/* ── Zone 4: Do this next (single action card) ── */}
      <FadeInView delay={0.12}>
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

      {/* ── Zone 5: Reach snapshot ── */}
      <FadeInView delay={0.16}>
        <section className="cc-profile-home__zone">
          <div className="cc-profile-home__zone-head">
            <div>
              <AppMono>Reach</AppMono>
              <h2 className="cc-profile-home__zone-title">This week at a glance</h2>
            </div>
            <AppButton variant="ghost" href={`${basePath}/analytics`}>
              Full analytics →
            </AppButton>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Profile views', value: stats.profileViews, spark: [8, 12, 10, 16, 14, 18] },
              { label: 'Project opens', value: stats.projectOpens, spark: [3, 6, 5, 9, 7, 11] },
              { label: 'Saves', value: stats.saves, spark: [1, 2, 2, 4, 3, 5] },
              { label: 'QR scans', value: stats.qrScans, spark: [2, 4, 3, 6, 5, 7] },
            ].map((s) => (
              <MetricCard key={s.label} label={s.label} value={<CountUp value={s.value} />}>
                <Sparkline points={s.spark} className="mt-3 h-8 w-full opacity-60" />
              </MetricCard>
            ))}
          </div>
        </section>
      </FadeInView>

      {/* ── Zone 6: Activity ── */}
      <FadeInView delay={0.2}>
        <section className="cc-profile-home__zone">
          <AppMono>Recent activity</AppMono>
          <ul className="cc-profile-activity-list mt-4">
            {activity.slice(0, 5).map((item) => (
              <li key={item.id} className="cc-profile-activity-list__item">
                <span>{item.text}</span>
                <time>{item.time}</time>
              </li>
            ))}
          </ul>
        </section>
      </FadeInView>
    </div>
  );
}
