'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label } from '@codecard/ui';
import type { Profile } from '@codecard/types';
import type { ProfileLinkRow } from '@/lib/profile/profile-link-core';
import { ProfileLinksEditor } from '@/components/profile/profile-links-editor';
import { parseProfileUpdate, profileToFormState } from '@/lib/profile/profile-form';
import { buildProfileFormData } from '@/lib/profile/profile-update-core';
import { ProfilePublishControls } from '@/components/profile/profile-publish-controls';
import { getSavedProfilePreviewHref } from '@/lib/profile/profile-preview';
import {
  updateProfileAction,
  type ProfileUpdateState,
} from '@/lib/profile/update-profile-action';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';

interface ProfileEditorProps {
  profile: Profile;
  links?: ProfileLinkRow[];
}

const PROFILE_FIELD_IDS: Record<string, string> = {
  display_name: 'display_name',
  slug: 'slug',
  headline: 'headline',
  bio: 'bio',
  location: 'location',
  skills: 'skills',
};

function focusProfileField(field?: string) {
  if (!field) return;
  const id = PROFILE_FIELD_IDS[field] ?? field;
  const el = document.getElementById(id);
  if (el instanceof HTMLElement) el.focus();
}

const initialState: ProfileUpdateState = {};

export function ProfileEditor({ profile, links = [] }: ProfileEditorProps) {
  const router = useRouter();
  const { notifySuccess, notifyError } = useMutationFeedback();
  const [form, setForm] = useState(() => profileToFormState(profile));
  const [clientError, setClientError] = useState('');
  const [clientFieldError, setClientFieldError] = useState<{
    field?: string;
    message: string;
  } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const notifiedErrorRef = useRef<string | null>(null);
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  useEffect(() => {
    if (!state.success) return;
    setSaveSuccess(true);
    notifySuccess(MUTATION_FEEDBACK.profile.saved);
    router.refresh();
  }, [state.success, router, notifySuccess]);

  useEffect(() => {
    if (!state.error && !state.fieldErrors) {
      notifiedErrorRef.current = null;
      return;
    }
    if (state.fieldErrors?.slug || state.fieldErrors?.display_name) return;
    if (state.error && notifiedErrorRef.current !== state.error) {
      notifiedErrorRef.current = state.error;
      notifyError(state.error, MUTATION_FEEDBACK.profile.saveFailed);
    }
  }, [state.error, state.fieldErrors, notifyError]);

  useEffect(() => {
    if (!saveSuccess) return;
    setForm(profileToFormState(profile));
  }, [profile, saveSuccess]);

  useEffect(() => {
    const errors = state.fieldErrors ?? {};
    const firstKey = Object.keys(errors)[0];
    if (firstKey) focusProfileField(firstKey);
  }, [state.fieldErrors]);

  const fieldErrors = {
    ...(state.fieldErrors ?? {}),
    ...(clientFieldError?.field
      ? { [clientFieldError.field]: clientFieldError.message }
      : {}),
  };

  const displayError =
    clientError ||
    (!fieldErrors.slug && !fieldErrors.display_name ? state.error : undefined) ||
    '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setClientError('');
    setClientFieldError(null);

    const parsed = parseProfileUpdate(form);
    if (!parsed.success) {
      setClientError(parsed.message);
      setClientFieldError({ field: parsed.field, message: parsed.message });
      focusProfileField(parsed.field);
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
          aria-invalid={Boolean(fieldErrors.display_name)}
          aria-describedby={fieldErrors.display_name ? 'display_name-error' : undefined}
        />
        {fieldErrors.display_name ? (
          <p id="display_name-error" className="text-sm text-red-400" role="alert">
            {fieldErrors.display_name}
          </p>
        ) : null}
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
          aria-invalid={Boolean(fieldErrors.slug)}
          aria-describedby={fieldErrors.slug ? 'slug-error' : undefined}
        />
        {fieldErrors.slug ? (
          <p id="slug-error" className="text-sm text-red-400" role="alert">
            {fieldErrors.slug}
          </p>
        ) : null}
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
      <ProfileLinksEditor links={links} />
      <ProfilePublishControls isPublic={profile.is_public} />
      {profile.slug && (
        <p className="text-sm">
          <a
            href={getSavedProfilePreviewHref(profile)}
            target={profile.is_public ? '_blank' : undefined}
            rel={profile.is_public ? 'noopener noreferrer' : undefined}
            className="font-medium text-violet-300 underline underline-offset-2"
          >
            Preview saved profile
          </a>
          {!profile.is_public && (
            <span className="mt-1 block text-zinc-500">
              Opens an owner-only preview of your saved card.
            </span>
          )}
        </p>
      )}
      {displayError && !fieldErrors.slug && !fieldErrors.display_name ? (
        <p className="text-sm text-red-400" role="alert">
          {displayError}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}
