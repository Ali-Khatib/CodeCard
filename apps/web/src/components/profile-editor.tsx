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
import { AudienceRoleField } from '@/components/profile/audience-role-field';
import { ProfilePublishControls } from '@/components/profile/profile-publish-controls';
import { getSavedProfilePreviewHref } from '@/lib/profile/profile-preview';
import {
  updateProfileAction,
  type ProfileUpdateState,
} from '@/lib/profile/update-profile-action';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';
import { HeadlineField } from '@/components/profile/headline-field';

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
  history_before: 'history_before',
  history_studied: 'history_studied',
  skills: 'skills',
  audience_role: 'audience_role',
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
  const [celebrating, setCelebrating] = useState(false);
  const notifiedErrorRef = useRef<string | null>(null);
  const celebratedStateRef = useRef<ProfileUpdateState | null>(null);
  const onDraftChangeRef = useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  useEffect(() => {
    if (!state.success || celebratedStateRef.current === state) return;
    celebratedStateRef.current = state;
    setSaveSuccess(true);
    setCelebrating(true);
    notifySuccess(MUTATION_FEEDBACK.profile.saved);
    router.refresh();
  }, [state, router, notifySuccess]);

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
    if (!celebrating) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timeout = window.setTimeout(() => setCelebrating(false), reduced ? 1400 : 2200);
    return () => window.clearTimeout(timeout);
  }, [celebrating]);

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
    setCelebrating(false);

    if (!form.audience_role) {
      const message = 'Choose what you are.';
      setClientError(message);
      setClientFieldError({ field: 'audience_role', message });
      focusProfileField('audience_role');
      notifyError(message, MUTATION_FEEDBACK.profile.saveFailed);
      return;
    }

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
      <form
        id="profile-editor"
        onSubmit={handleSubmit}
        className="space-y-5"
        aria-busy={pending}
        noValidate
      >
        <div id="audience_role" className="scroll-mt-28">
          <AudienceRoleField
            value={form.audience_role}
            onChange={(role) => setForm({ ...form, audience_role: role })}
            error={fieldErrors.audience_role}
            disabled={pending}
          />
        </div>

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

        <HeadlineField
          value={form.headline}
          disabled={pending}
          onChange={(headline) => setForm({ ...form, headline })}
        />

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
            placeholder="City, optional"
            aria-describedby="location-hint"
          />
          <p id="location-hint" className="text-[12px] text-[var(--app-smoke)]">
            Optional. Leave it blank and your card simply will not show a city.
          </p>
        </div>

        <fieldset className="m-0 w-full min-w-0 space-y-3 rounded-xl border border-[var(--app-border)] p-3">
          <legend className="px-1 text-[13px] font-medium text-[var(--app-ink)]">Card history</legend>
          <p id="history-hint" className="text-[12px] leading-relaxed text-[var(--app-smoke)]">
            Optional, and worth filling in. Spin the card and these lines show on the back, under
            your name. Your headline is Now and your city is Based, so you only add what is missing.
            Leave them blank and the back stays a short snapshot.
          </p>
          <div className="space-y-2">
            <FieldLabel htmlFor="history_before">Before</FieldLabel>
            <input
              id="history_before"
              name="history_before"
              className="cc-app-input"
              value={form.history_before}
              maxLength={80}
              onChange={(e) => setForm({ ...form, history_before: e.target.value })}
              placeholder="Early engineer at a startup"
              aria-invalid={Boolean(fieldErrors.history_before)}
              aria-describedby="history-hint"
            />
            {fieldErrors.history_before ? (
              <p className="text-sm text-red-600" role="alert">
                {fieldErrors.history_before}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="history_studied">Studied</FieldLabel>
            <input
              id="history_studied"
              name="history_studied"
              className="cc-app-input"
              value={form.history_studied}
              maxLength={80}
              onChange={(e) => setForm({ ...form, history_studied: e.target.value })}
              placeholder="B.S. Computer Science"
              aria-invalid={Boolean(fieldErrors.history_studied)}
              aria-describedby="history-hint"
            />
            {fieldErrors.history_studied ? (
              <p className="text-sm text-red-600" role="alert">
                {fieldErrors.history_studied}
              </p>
            ) : null}
          </div>
        </fieldset>

        <div className="space-y-2 scroll-mt-28" id="skills-field">
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
        form="profile-editor"
        className={`cc-profile-save${celebrating ? ' cc-profile-save--yes' : ''}`}
        disabled={pending}
        aria-busy={pending}
      >
        {celebrating ? (
          <>
            <span className="cc-profile-save__check" aria-hidden>
              <svg viewBox="0 0 24 24">
                <circle className="cc-profile-save__ring" cx="12" cy="12" r="10" />
                <path className="cc-profile-save__tick" d="M7 12.5 10.2 16 17 8.5" />
              </svg>
            </span>
            <span>Yes. Saved.</span>
          </>
        ) : pending ? (
          'Saving…'
        ) : (
          'Save changes'
        )}
      </button>
    </div>
  );
}
