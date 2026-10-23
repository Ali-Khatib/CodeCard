'use client';

import { useEffect, useState } from 'react';
import type { Profile } from '@codecard/types';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import type { ProfileLinkRow } from '@/lib/profile/profile-link-core';
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
          <AvatarUpload
            displayName={draft.displayName}
            initialAvatarUrl={avatarUrl}
            preview={preview}
            onAvatarSaved={preview ? undefined : setAvatarUrl}
          />

          <ProfileEditor
            profile={profile}
            links={profileLinks}
            preview={preview}
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
