'use client';

import { startTransition, useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Profile } from '@codecard/types';
import type { ProfileLinkRow } from '@/lib/profile/profile-link-core';
import { ProfileLinksEditor } from '@/components/profile/profile-links-editor';
import {
  parseProfileUpdate,
  profileToFormState,
  type ProfileFormState,
} from '@/lib/profile/profile-form';
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
  onDraftChange?: (form: ProfileFormState) => void;
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

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="cc-app-field-label">
      {children}
    </label>
  );
}

export function ProfileEditor({ profile, links = [], onDraftChange }: ProfileEditorProps) {
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
  const onDraftChangeRef = useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;
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

  useEffect(() => {
    onDraftChangeRef.current?.(form);
  }, [form]);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setClientError('');
    setClientFieldError(null);
    setSaveSuccess(false);

    const parsed = parseProfileUpdate(form);
    if (!parsed.success) {
      setClientError(parsed.message);
      setClientFieldError({ field: parsed.field, message: parsed.message });
      focusProfileField(parsed.field);
      notifyError(parsed.message, MUTATION_FEEDBACK.profile.saveFailed);
      return;
    }

    // useActionState dispatch must run inside a transition when called manually.
    startTransition(() => {
      formAction(buildProfileFormData(form));
    });
  }

  return (
    <div className="max-w-xl space-y-8">
      {/* The links editor renders its own <form>; nesting forms is invalid
          HTML (the browser drops the inner tag during SSR), so the profile
          form must close before it. */}
      <form onSubmit={handleSubmit} className="space-y-5" aria-busy={pending} noValidate>
        <div className="space-y-2">
          <FieldLabel htmlFor="display_name">Display name</FieldLabel>
          <input
            id="display_name"
            name="display_name"
            className="cc-app-input"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            aria-invalid={Boolean(fieldErrors.display_name)}
            aria-describedby={fieldErrors.display_name ? 'display_name-error' : undefined}
          />
          {fieldErrors.display_name ? (
            <p id="display_name-error" className="text-sm text-red-600" role="alert">
              {fieldErrors.display_name}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 scroll-mt-28" id="headline-field">
          <FieldLabel htmlFor="headline">Headline</FieldLabel>
          <input
            id="headline"
            name="headline"
            className="cc-app-input scroll-mt-28"
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
            placeholder="e.g. Full-stack engineer building developer tools"
          />
        </div>

        <div className="space-y-2 scroll-mt-28">
          <FieldLabel htmlFor="slug">Profile URL</FieldLabel>
          <input
            id="slug"
            name="slug"
            className="cc-app-input scroll-mt-28"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
            aria-invalid={Boolean(fieldErrors.slug)}
            aria-describedby={fieldErrors.slug ? 'slug-error' : undefined}
          />
          {fieldErrors.slug ? (
            <p id="slug-error" className="text-sm text-red-600" role="alert">
              {fieldErrors.slug}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 scroll-mt-28" id="bio-field">
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          <textarea
            id="bio"
            name="bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
            placeholder="A short intro visitors see on your public card"
            className="cc-app-input min-h-[120px] resize-y"
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="location">Location</FieldLabel>
          <input
            id="location"
            name="location"
            className="cc-app-input"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. San Francisco, CA"
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="skills">Skills</FieldLabel>
          <input
            id="skills"
            name="skills"
            className="cc-app-input"
            value={form.skillsInput}
            onChange={(e) => setForm({ ...form, skillsInput: e.target.value })}
            placeholder="TypeScript, Next.js, C++"
          />
          <p className="text-[12px] text-[var(--app-smoke)]">Separate skills with commas.</p>
        </div>

        {displayError ? (
          <p className="text-sm text-red-600" role="alert">
            {displayError}
          </p>
        ) : null}

        <div aria-live="polite">
          {pending ? (
            <p className="text-sm text-[var(--app-smoke)]" role="status">
              Saving your profile…
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          className="cc-app-btn cc-app-btn--primary"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <ProfileLinksEditor links={links} />
      <ProfilePublishControls isPublic={profile.is_public} />

      {profile.slug ? (
        <p className="text-sm">
          <a
            href={getSavedProfilePreviewHref(profile)}
            target={profile.is_public ? '_blank' : undefined}
            rel={profile.is_public ? 'noopener noreferrer' : undefined}
            className="font-medium text-[var(--app-ink)] underline underline-offset-2"
          >
            Preview saved profile
          </a>
          {!profile.is_public ? (
            <span className="mt-1 block text-[var(--app-smoke)]">
              Opens an owner-only preview of your saved card.
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
