'use client';

import { useEffect, useState } from 'react';
import { CountUp } from '@/components/landing/count-up';
import { AvatarUpload } from '@/components/dashboard/avatar-upload';
import { ProfileEditor } from '@/components/profile-editor';
import { ProfileVisitorPreview } from '@/components/dashboard/profile-visitor-preview';
import { ProfileCompletionIndicator } from '@/components/dashboard/profile-completion-indicator';
import { CopyLinkButton } from '@/components/ui/copy-link-button';
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
  const [liveName, setLiveName] = useState(profile.display_name);
  const [liveHeadline, setLiveHeadline] = useState(profile.headline ?? '');
  const [liveBio, setLiveBio] = useState(profile.bio ?? '');
  const [liveLocation, setLiveLocation] = useState(profile.location ?? '');
  const [liveSlug, setLiveSlug] = useState(profile.slug);

  useEffect(() => {
    setAvatarUrl(profile.avatar_url);
  }, [profile.avatar_url]);

  useEffect(() => {
    setLiveName(profile.display_name);
    setLiveHeadline(profile.headline ?? '');
    setLiveBio(profile.bio ?? '');
    setLiveLocation(profile.location ?? '');
    setLiveSlug(profile.slug);
  }, [profile.bio, profile.display_name, profile.headline, profile.location, profile.slug]);

  return (
    <div className="cc-app-page cc-app-page--1120">
      <PageHeader
        eyebrow="Profile"
        title="Public identity"
        description="Edit what visitors see when they open your shared link or scan your QR."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <AppCard className="space-y-6">
          <h2 className="cc-app-section-label !text-[clamp(20px,2.4vw,24px)]">Profile details</h2>

          <AvatarUpload
            displayName={profile.display_name}
            initialAvatarUrl={avatarUrl}
            preview={preview}
            onAvatarSaved={preview ? undefined : setAvatarUrl}
          />

          <ProfileEditor
            profile={profile}
            links={profileLinks}
            preview={preview}
            onDraftChange={
              preview
                ? (form) => {
                    setLiveName(form.display_name);
                    setLiveHeadline(form.headline);
                    setLiveBio(form.bio);
                    setLiveLocation(form.location);
                    setLiveSlug(form.slug);
                  }
                : undefined
            }
            onPersisted={(form) => {
              setLiveName(form.display_name);
              setLiveHeadline(form.headline);
              setLiveBio(form.bio);
              setLiveLocation(form.location);
              setLiveSlug(form.slug);
            }}
          />

          <div className="flex flex-wrap gap-2 border-t border-[var(--app-border)] pt-6">
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
                variant="ghost"
              >
                Copy public link
              </CopyLinkButton>
            )}
          </div>
        </AppCard>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <AppCard>
            <ProfileVisitorPreview
              displayName={liveName}
              headline={liveHeadline}
              bio={liveBio}
              location={liveLocation}
              avatarUrl={avatarUrl}
              slug={liveSlug}
              isPublic={profile.is_public === true}
              links={links}
            />
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
