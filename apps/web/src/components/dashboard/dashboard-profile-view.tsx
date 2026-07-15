'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CountUp } from '@/components/landing/count-up';
import { AvatarUpload } from '@/components/dashboard/avatar-upload';
import { ProfileEditor } from '@/components/profile-editor';
import { DashboardProfileHeader } from '@/components/dashboard/dashboard-profile-header';
import { ProfileCompletionIndicator } from '@/components/dashboard/profile-completion-indicator';
import { CopyLinkButton } from '@/components/ui/copy-link-button';
import { profileToPortfolioCreator } from '@/lib/dashboard/portfolio';
import { profileAvatarAltText } from '@/lib/profile/avatar-url';
import { getSavedProfilePreviewHref } from '@/lib/profile/profile-preview';
import { getPublicProfileLinkForClipboard } from '@/lib/sharing/qr';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import type { ProfileLinkRow } from '@/lib/profile/profile-link-core';
import type { ProfileCompletionResult } from '@/lib/profile/completion';
import type { Profile } from '@codecard/types';
import { AppButton, AppCard, AppMono, PageHeader } from './ui/dashboard-ui';

type DashboardProfileViewProps = {
  profile: Profile;
  completion: ProfileCompletionResult;
  profileViews: number;
  profileLinks?: ProfileLinkRow[];
  links?: ProfileLinkItem[];
  preview?: boolean;
};

export function DashboardProfileView({
  profile,
  completion,
  profileViews,
  profileLinks = [],
  links = [],
  preview = false,
}: DashboardProfileViewProps) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);

  useEffect(() => {
    setAvatarUrl(profile.avatar_url);
  }, [profile.avatar_url]);

  const creator = profileToPortfolioCreator(
    {
      display_name: profile.display_name,
      headline: profile.headline,
      avatar_url: avatarUrl,
      slug: profile.slug,
      location: profile.location,
    },
    links,
  );

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

          {!preview ? (
            <AvatarUpload
              displayName={profile.display_name}
              initialAvatarUrl={avatarUrl}
              onAvatarSaved={setAvatarUrl}
            />
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full border border-[var(--app-border)]">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={profileAvatarAltText(profile.display_name)}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[var(--app-bone)] text-2xl">
                    {profile.display_name[0]}
                  </div>
                )}
              </div>
            </div>
          )}

          {!preview ? (
            <ProfileEditor profile={profile} links={profileLinks} />
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
              <AppButton variant="ghost" href={getSavedProfilePreviewHref(profile)}>
                Preview
              </AppButton>
            )}
            {profile.slug && (
              <CopyLinkButton
                getText={() => getPublicProfileLinkForClipboard(profile.slug) ?? ''}
                ariaLabel="Copy public link"
                successLabel="Public link copied"
                variant="soft"
              >
                Copy public link
              </CopyLinkButton>
            )}
          </div>
        </AppCard>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <AppCard>
            <AppMono>Live preview</AppMono>
            <div className="mt-4 rounded-[16px] border border-[var(--app-border)] p-4">
              <DashboardProfileHeader creator={creator} profileSlug={profile.slug} embedded />
            </div>
          </AppCard>

          <AppCard>
            <AppMono>Share tools</AppMono>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--app-smoke)]">
              Use Home for the real QR preview, PNG download, Copy public link, and Share profile
              (where your browser supports it). Wallet and NFC are not available in the MVP.
            </p>
            <AppButton variant="ghost" className="mt-4" href="/dashboard">
              Open Home share tools
            </AppButton>
          </AppCard>

          <div className="grid grid-cols-2 gap-3">
            <AppCard className="!p-4">
              <ProfileCompletionIndicator completion={completion} variant="compact" />
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
