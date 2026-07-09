'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { CountUp } from '@/components/landing/count-up';
import { ProfileEditor } from '@/components/profile-editor';
import { DashboardProfileHeader } from '@/components/dashboard/dashboard-profile-header';
import { CopyLinkButton } from '@/components/ui/copy-link-button';
import { AsyncActionButton } from '@/components/ui/async-action-button';
import { profileToPortfolioCreator } from '@/lib/dashboard/portfolio';
import type { Profile } from '@codecard/types';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import { AppButton, AppCard, AppMono, PageHeader } from './ui/dashboard-ui';

type DashboardProfileViewProps = {
  profile: Profile;
  completion: number;
  profileViews: number;
  links?: ProfileLinkItem[];
  preview?: boolean;
};

export function DashboardProfileView({
  profile,
  completion,
  profileViews,
  links = [],
  preview = false,
}: DashboardProfileViewProps) {
  const creator = profileToPortfolioCreator(
    {
      display_name: profile.display_name,
      headline: profile.headline,
      avatar_url: profile.avatar_url,
      slug: profile.slug,
    },
    links,
  );

  const [company, setCompany] = useState('Stripe');
  const [location, setLocation] = useState('San Francisco');

  return (
    <div className="cc-app-page cc-app-page--1120">
      <PageHeader
        eyebrow="Profile"
        title="Public identity"
        description="Edit the information visitors see on your CodeCard."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <AppCard className="space-y-6">
          <h2 className="text-[20px] font-medium text-[var(--app-ink)]">Profile details</h2>

          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border border-[var(--app-border)]">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="" fill className="object-cover" sizes="80px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--app-bone)] text-2xl">
                  {profile.display_name[0]}
                </div>
              )}
            </div>
            <AppButton variant="ghost">Change photo</AppButton>
          </div>

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

          {!preview ? (
            <ProfileEditor profile={profile} />
          ) : (
            <div className="space-y-4">
              <label className="block">
                <span className="cc-app-mono">Display name</span>
                <input className="cc-app-input mt-2" defaultValue={profile.display_name} readOnly />
              </label>
              <label className="block">
                <span className="cc-app-mono">Headline</span>
                <input className="cc-app-input mt-2" defaultValue={profile.headline ?? ''} readOnly />
              </label>
              <label className="block">
                <span className="cc-app-mono">Bio</span>
                <textarea
                  className="cc-app-input mt-2 min-h-[100px] resize-y"
                  defaultValue={profile.bio ?? ''}
                  readOnly
                />
              </label>
              <p className="text-[14px] text-[var(--app-smoke)]">
                <Link href="/sign-up" className="font-medium text-[var(--app-ink)] underline">
                  Create an account
                </Link>{' '}
                to save changes.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-[var(--app-border)] pt-6">
            {!preview && <AppButton variant="primary">Save changes</AppButton>}
            {profile.slug && (
              <AppButton variant="ghost" href={`/${profile.slug}`}>
                Preview
              </AppButton>
            )}
            {profile.slug && (
              <CopyLinkButton
                getText={() => `${window.location.origin}/${profile.slug}`}
                variant="soft"
              />
            )}
            <AsyncActionButton
              variant="ghost"
              className="mt-0"
              successLabel="Saved"
              onAction={async () => {
                await new Promise((r) => setTimeout(r, 450));
              }}
            >
              Download QR
            </AsyncActionButton>
          </div>
        </AppCard>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <AppCard>
            <AppMono>Live preview</AppMono>
            <div className="mt-4 rounded-[16px] border border-[var(--app-border)] p-4">
              <DashboardProfileHeader creator={creator} profileSlug={profile.slug} embedded />
            </div>
          </AppCard>

          <AppCard className="text-center">
            <AppMono>QR code</AppMono>
            <div className="mx-auto mt-4 grid h-32 w-32 grid-cols-5 grid-rows-5 gap-px bg-[var(--app-bone)] p-2">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className={i % 2 === 0 ? 'bg-[var(--app-ink)]' : 'bg-transparent'} />
              ))}
            </div>
            <p className="mt-3 text-[13px] text-[var(--app-smoke)]">codecard.app/{profile.slug}</p>
            <AsyncActionButton
              variant="primary"
              block
              className="mt-4"
              successLabel="Saved"
              onAction={async () => {
                await new Promise((r) => setTimeout(r, 450));
              }}
            >
              Download QR
            </AsyncActionButton>
          </AppCard>

          <div className="grid grid-cols-2 gap-3">
            <AppCard className="!p-4">
              <AppMono>Completion</AppMono>
              <p className="mt-2 text-[28px] font-medium">
                <CountUp value={completion} />%
              </p>
            </AppCard>
            <AppCard className="!p-4">
              <AppMono>Views</AppMono>
              <p className="mt-2 text-[28px] font-medium">
                <CountUp value={profileViews} />
              </p>
            </AppCard>
          </div>
        </aside>
      </div>
    </div>
  );
}
