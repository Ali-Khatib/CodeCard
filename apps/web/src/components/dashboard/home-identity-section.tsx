'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Profile } from '@codecard/types';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import type { ProfileLinkRow } from '@/lib/profile/profile-link-core';
import { profileAvatarAltText } from '@/lib/profile/avatar-url';
import { AvatarUpload } from '@/components/dashboard/avatar-upload';
import { ProfileEditor } from '@/components/profile-editor';
import type { ProfileFormState } from '@/lib/profile/profile-form';
import { HomeCodeCardPreview } from './home-codecard-preview';

type HomeIdentitySectionProps = {
  profile: Profile;
  profileLinks?: ProfileLinkRow[];
  links?: ProfileLinkItem[];
  preview?: boolean;
};

export function HomeIdentitySection({
  profile,
  profileLinks = [],
  links = [],
  preview = false,
}: HomeIdentitySectionProps) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [draft, setDraft] = useState({
    displayName: profile.display_name,
    headline: profile.headline,
    bio: profile.bio,
    location: profile.location,
    slug: profile.slug,
  });

  useEffect(() => {
    setAvatarUrl(profile.avatar_url);
    setDraft({
      displayName: profile.display_name,
      headline: profile.headline,
      bio: profile.bio,
      location: profile.location,
      slug: profile.slug,
    });
  }, [profile]);

  return (
    <section id="profile" className="cc-profile-home__zone cc-home-identity scroll-mt-24">
      <div className="cc-home-identity__intro">
        <p className="cc-workspace-section__eyebrow">Your public card</p>
        <h2 className="cc-workspace-section__title">How people see you</h2>
        <p className="cc-workspace-section__copy">
          This is the face of your CodeCard. Keep your photo, headline, bio, and links up to date.
        </p>
      </div>

      <div className="cc-home-identity__layout">
        <div className="cc-app-card cc-home-identity__editor space-y-6">
          {!preview ? (
            <AvatarUpload
              displayName={draft.displayName}
              initialAvatarUrl={avatarUrl}
              onAvatarSaved={setAvatarUrl}
            />
          ) : (
            <div id="photo" className="flex items-center gap-4 scroll-mt-28">
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
            <ProfileEditor
              profile={profile}
              links={profileLinks}
              onDraftChange={(form: ProfileFormState) => {
                setDraft({
                  displayName: form.display_name,
                  headline: form.headline || null,
                  bio: form.bio || null,
                  location: form.location || null,
                  slug: form.slug,
                });
              }}
            />
          ) : (
            <div className="space-y-4">
              <label className="block" htmlFor="display_name">
                <span className="cc-app-mono">Display name</span>
                <input
                  id="display_name"
                  className="cc-app-input mt-2"
                  defaultValue={profile.display_name}
                  readOnly
                />
              </label>
              <label className="block" htmlFor="headline">
                <span className="cc-app-mono">Headline</span>
                <input
                  id="headline"
                  className="cc-app-input mt-2 scroll-mt-28"
                  defaultValue={profile.headline ?? ''}
                  readOnly
                />
              </label>
              <label className="block" htmlFor="bio">
                <span className="cc-app-mono">Bio</span>
                <textarea
                  id="bio"
                  className="cc-app-input mt-2 min-h-[100px] resize-y scroll-mt-28"
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
        </div>

        <div className="cc-home-identity__preview">
          <HomeCodeCardPreview
            displayName={draft.displayName}
            headline={draft.headline}
            bio={draft.bio}
            location={draft.location}
            avatarUrl={avatarUrl}
            slug={draft.slug || profile.slug}
            isPublic={profile.is_public === true}
            links={links}
          />
        </div>
      </div>
    </section>
  );
}
