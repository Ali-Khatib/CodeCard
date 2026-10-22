'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Profile } from '@codecard/types';
import type { ProfileLinkRow } from '@/lib/profile/profile-link-core';
import { ProfileLinksEditor } from '@/components/profile/profile-links-editor';
import {
  parseProfileUpdate,
  profileToFormState,
  type ProfileFormState,
} from '@/lib/profile/profile-form';
import { buildProfileFormData, type ProfileUpdateState } from '@/lib/profile/profile-update-core';
import { postProfileSave } from '@/lib/profile/save-profile-client';
import { AudienceRoleField } from '@/components/profile/audience-role-field';
import { ProfilePublishControls } from '@/components/profile/profile-publish-controls';
import { getSavedProfilePreviewHref } from '@/lib/profile/profile-preview';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';
import { HeadlineField } from '@/components/profile/headline-field';

function EditorSection({
  title,
  hint,
  children,
  defaultOpen = false,
  id,
}: {
  title: string;
  hint: string;
  children: ReactNode;
  defaultOpen?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className={`cc-editor-section${open ? ' is-open' : ''}`} id={id}>
      <button
        type="button"
        className="cc-editor-section__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="cc-editor-section__copy">
          <span className="cc-editor-section__title">{title}</span>
          <span>{hint}</span>
        </span>
        <ChevronDown className="cc-editor-section__chevron" aria-hidden />
      </button>
      <div id={panelId} className={`cc-editor-section__panel${open ? ' is-open' : ''}`}>
        <div className="cc-editor-section__panel-inner" inert={!open}>
          {children}
        </div>
      </div>
    </section>
  );
}

interface ProfileEditorProps {
  profile: Profile;
  links?: ProfileLinkRow[];
  onDraftChange?: (form: ProfileFormState) => void;
  /** Fired after the server confirms the save. The form already holds those values. */
  onPersisted?: (form: ProfileFormState) => void;
}

const PROFILE_FIELD_IDS: Record<string, string> = {
  display_name: 'display_name',
  slug: 'slug',
  headline: 'headline',
  bio: 'bio',
  location: 'location',
  history_working: 'history_working',
  history_before: 'history_before',
  history_studying: 'history_studying',
  history_studied: 'history_studied',
  skills: 'skills',
  audience_role: 'audience_role',
};

function focusProfileField(field?: string) {
  if (!field) return;
  const id = PROFILE_FIELD_IDS[field] ?? field;
  const el = document.getElementById(id);
  if (!(el instanceof HTMLElement)) return;
  const details = el.closest('details');
  if (details) details.open = true;
  el.focus();
}

const initialState: ProfileUpdateState = {};

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="cc-app-field-label">
      {children}
    </label>
  );
}

export function ProfileEditor({ profile, links = [], onDraftChange, onPersisted }: ProfileEditorProps) {
  const { notifySuccess, notifyError } = useMutationFeedback();
  const [form, setForm] = useState(() => profileToFormState(profile));
  const [clientError, setClientError] = useState('');
  const [clientFieldError, setClientFieldError] = useState<{
    field?: string;
    message: string;
  } | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const notifiedErrorRef = useRef<string | null>(null);
  const celebratedStateRef = useRef<ProfileUpdateState | null>(null);
  const onDraftChangeRef = useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;
  const onPersistedRef = useRef(onPersisted);
  onPersistedRef.current = onPersisted;
  const formRef = useRef(form);
  formRef.current = form;
  const versionRef = useRef(profile.updated_at);
  const submitLockRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<ProfileUpdateState>(initialState);

  useEffect(() => {
    if (submitLockRef.current) return;
    versionRef.current = profile.updated_at;
  }, [profile.updated_at]);

  useEffect(() => {
    if (!state.success || celebratedStateRef.current === state) return;
    celebratedStateRef.current = state;
    if (state.updatedAt) versionRef.current = state.updatedAt;
    setCelebrating(true);
    notifySuccess(MUTATION_FEEDBACK.profile.saved);
    onPersistedRef.current?.(formRef.current);
  }, [state, notifySuccess]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending || submitLockRef.current) return;
    setClientError('');
    setClientFieldError(null);
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

    submitLockRef.current = true;
    setPending(true);
    try {
      const result = await postProfileSave(
        buildProfileFormData({ ...form, updatedAt: versionRef.current }),
      );
      if (result.updatedAt) versionRef.current = result.updatedAt;
      setState(result);
    } finally {
      submitLockRef.current = false;
      setPending(false);
    }
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
        <EditorSection title="Basic information" hint="Name, headline, bio, location">
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
          />
        </div>
        </EditorSection>

        <EditorSection title="Experience and education" hint="Work and academic history">
          <p id="history-hint" className="text-[12px] text-[var(--app-smoke)]">
            These lines appear on the back of your card. Leave a line blank to hide it.
          </p>
          {(
            [
              {
                id: 'history_working',
                label: 'Current employment',
                placeholder: 'Software engineer at Stripe',
              },
              {
                id: 'history_before',
                label: 'Past employment',
                placeholder: 'Early engineer at a startup',
              },
              {
                id: 'history_studying',
                label: 'Current education',
                placeholder: 'M.S. Computer Science, in progress',
              },
              {
                id: 'history_studied',
                label: 'Past education',
                placeholder: 'B.S. Computer Science',
              },
            ] as const
          ).map((field) => (
            <div key={field.id} className="space-y-2">
              <FieldLabel htmlFor={field.id}>{field.label}</FieldLabel>
              <input
                id={field.id}
                name={field.id}
                className="cc-app-input"
                value={form[field.id]}
                maxLength={80}
                onChange={(e) => setForm({ ...form, [field.id]: e.target.value })}
                placeholder={field.placeholder}
                aria-invalid={Boolean(fieldErrors[field.id])}
                aria-describedby="history-hint"
              />
              {fieldErrors[field.id] ? (
                <p className="text-sm text-red-600" role="alert">
                  {fieldErrors[field.id]}
                </p>
              ) : null}
            </div>
          ))}
        </EditorSection>

        <EditorSection id="skills-field" title="Skills" hint="Technologies and expertise">
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
        </EditorSection>

      </form>

      <EditorSection id="links" title="Social links" hint="GitHub, LinkedIn, website">
        <ProfileLinksEditor links={links} />
      </EditorSection>
      <EditorSection id="visibility" title="Visibility" hint="Publishing and public URL">
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
      </EditorSection>

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

      <div className="cc-profile-save-bar">
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
            <span>Saved successfully</span>
          </>
        ) : pending ? (
          'Saving…'
        ) : (
          'Save changes'
        )}
      </button>
      </div>
    </div>
  );
}
