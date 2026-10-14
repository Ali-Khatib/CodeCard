'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AvatarUpload } from '@/components/dashboard/avatar-upload';
import { ProfileEditor } from '@/components/profile-editor';
import type { ProfileLinkRow } from '@/lib/profile/profile-link-core';
import type { Profile } from '@codecard/types';

export function ProfileEditorScreen({
  profile,
  links,
}: {
  profile: Profile;
  links: ProfileLinkRow[];
}) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);

  return (
    <div className="cc-app-page cc-editor-page">
      <header className="cc-editor-page__head">
        <div>
          <p className="cc-app-mono">CodeCard</p>
          <h1 className="cc-editor-page__title">Edit CodeCard</h1>
        </div>
        <Link href="/dashboard" className="cc-home-desk__text-link">
          Back to Home
        </Link>
      </header>
      <AvatarUpload
        displayName={profile.display_name}
        initialAvatarUrl={avatarUrl}
        onAvatarSaved={setAvatarUrl}
      />
      <ProfileEditor profile={profile} links={links} />
    </div>
  );
}
