'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label } from '@codecard/ui';
import type { Profile } from '@codecard/types';
import { parseProfileUpdate, profileToFormState } from '@/lib/profile/profile-form';
import { buildProfileFormData } from '@/lib/profile/profile-update-core';
import { ProfilePublishControls } from '@/components/profile/profile-publish-controls';
import {
  updateProfileAction,
  type ProfileUpdateState,
} from '@/lib/profile/update-profile-action';

interface ProfileEditorProps {
  profile: Profile;
}

const initialState: ProfileUpdateState = {};

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState(() => profileToFormState(profile));
  const [clientError, setClientError] = useState('');
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  const displayError =
    clientError || state.fieldErrors?.slug || state.fieldErrors?.display_name || state.error || '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setClientError('');

    const parsed = parseProfileUpdate(form);
    if (!parsed.success) {
      setClientError(parsed.message);
      return;
    }

    formAction(buildProfileFormData(form));
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          value={form.display_name}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
          placeholder="e.g. Full-stack engineer building developer tools"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Profile URL</Label>
        <Input
          id="slug"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
          aria-invalid={Boolean(state.fieldErrors?.slug)}
        />
        {state.fieldErrors?.slug && (
          <p className="text-sm text-red-400" role="alert">
            {state.fieldErrors.slug}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio (shown later on profile)</Label>
        <textarea
          id="bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={4}
          className="flex w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="e.g. San Francisco, CA"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="skills">Skills (comma-separated)</Label>
        <Input
          id="skills"
          value={form.skillsInput}
          onChange={(e) => setForm({ ...form, skillsInput: e.target.value })}
          placeholder="TypeScript, Next.js, C++"
        />
      </div>
      <ProfilePublishControls isPublic={profile.is_public} />
      {displayError && !state.fieldErrors?.slug && (
        <p className="text-sm text-red-400" role="alert">
          {displayError}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}
