'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createProjectAction, updateProjectAction, type ProjectCreateState, type ProjectUpdateState } from '@/app/actions/projects';
import { handleSessionExpired } from '@/lib/auth/session-expiry';
import {
  buildCreateProjectFormData,
  buildUpdateProjectFormData,
  createEmptyProjectFormValues,
  PROJECT_FORM_DOMAIN_OPTIONS,
  PROJECT_FORM_FOCUS_AREA_OPTIONS,
  PROJECT_FORM_LIMITS,
  PROJECT_FORM_STATUS_OPTIONS,
  suggestProjectSlugFromTitle,
  validateProjectFormClient,
  type ProjectFormMode,
  type ProjectFormValues,
} from '@/lib/projects/project-form';
import { cn } from '@/lib/cn';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';

const initialCreateState: ProjectCreateState = {};
const initialUpdateState: ProjectUpdateState = {};

type ProjectFormState = ProjectCreateState | ProjectUpdateState;

function isRecoverableProjectFailure(state: ProjectFormState): boolean {
  return state.errorCode === 'server';
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-[13px] text-red-400" role="alert">
      {message}
    </p>
  );
}

function ToggleChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        'rounded-full border px-3 py-1.5 text-[13px] transition-colors',
        selected
          ? 'border-reactor/60 bg-reactor/15 text-vellum'
          : 'border-charcoal/80 bg-charcoal/40 text-lichen hover:border-graphite',
      )}
    >
      {label}
    </button>
  );
}

export function ProjectForm({
  mode,
  initialUsage = null,
  projectId,
  initialValues,
}: {
  mode: ProjectFormMode;
  initialUsage?: { count: number; limit: number | null } | null;
  projectId?: string;
  initialValues?: ProjectFormValues;
}) {
  const router = useRouter();
  const { notifySuccess, notifyError } = useMutationFeedback();
  const editPath =
    mode === 'edit' && projectId ? `/dashboard/projects/${projectId}/edit` : '/dashboard/projects/new';
  const slugInputRef = useRef<HTMLInputElement>(null);
  const submitLockRef = useRef(false);
  const completedRef = useRef(false);
  const notifiedSuccessRef = useRef(false);
  const notifiedErrorRef = useRef<string | null>(null);
  const [form, setForm] = useState<ProjectFormValues>(
    () => initialValues ?? createEmptyProjectFormValues(),
  );
  const [slugEdited, setSlugEdited] = useState(mode === 'edit' || Boolean(initialValues));
  const [techInput, setTechInput] = useState('');
  const [clientError, setClientError] = useState('');
  const [recoverableError, setRecoverableError] = useState('');
  const [createState, createAction, createPending] = useActionState(
    createProjectAction,
    initialCreateState,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateProjectAction,
    initialUpdateState,
  );

  const state = mode === 'edit' ? updateState : createState;
  const formAction = mode === 'edit' ? updateAction : createAction;
  const pending = mode === 'edit' ? updatePending : createPending;
  const usage = mode === 'create' ? (createState.usage ?? initialUsage) : null;
  const limitReached =
    mode === 'create' && usage?.limit != null && usage.count >= usage.limit;

  useEffect(() => {
    if (!state.success) {
      notifiedSuccessRef.current = false;
      return;
    }
    if (notifiedSuccessRef.current) return;
    notifiedSuccessRef.current = true;

    if (mode === 'create' && 'redirectTo' in state && state.redirectTo) {
      completedRef.current = true;
      notifySuccess(MUTATION_FEEDBACK.project.created);
      router.push(state.redirectTo);
      return;
    }

    if (mode === 'edit') {
      notifySuccess(MUTATION_FEEDBACK.project.saved);
      router.refresh();
    }
  }, [mode, state, router, notifySuccess]);

  useEffect(() => {
    if (state.errorCode === 'auth') {
      handleSessionExpired(editPath);
      notifyError(MUTATION_FEEDBACK.sessionExpired);
    }
  }, [state.errorCode, editPath, notifyError]);

  useEffect(() => {
    if (state.errorCode === 'slug_taken' || state.fieldErrors?.slug) {
      slugInputRef.current?.focus();
    }
  }, [state.errorCode, state.fieldErrors?.slug]);

  useEffect(() => {
    if (isRecoverableProjectFailure(state)) {
      const message = state.error ?? MUTATION_FEEDBACK.project.saveFailed;
      setRecoverableError(message);
      if (notifiedErrorRef.current !== message) {
        notifiedErrorRef.current = message;
        notifyError(message, MUTATION_FEEDBACK.project.saveFailed);
      }
      return;
    }
    if (state.success) {
      setRecoverableError('');
      notifiedErrorRef.current = null;
      return;
    }
    if (
      state.error &&
      state.errorCode !== 'limit' &&
      state.errorCode !== 'auth' &&
      !state.fieldErrors?.slug &&
      !state.fieldErrors?.title
    ) {
      const fallback =
        mode === 'create' ? MUTATION_FEEDBACK.project.createFailed : MUTATION_FEEDBACK.project.saveFailed;
      if (notifiedErrorRef.current !== state.error) {
        notifiedErrorRef.current = state.error;
        notifyError(state.error, fallback);
      }
    }
  }, [state, mode, notifyError]);

  function updateTitle(value: string) {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugEdited ? prev.slug : suggestProjectSlugFromTitle(value),
    }));
  }

  function updateSlug(value: string) {
    setSlugEdited(true);
    setForm((prev) => ({ ...prev, slug: value.toLowerCase() }));
  }

  function addTechnology() {
    const trimmed = techInput.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (form.technologies.some((tech) => tech.toLowerCase() === key)) {
      setTechInput('');
      return;
    }
    setForm((prev) => ({ ...prev, technologies: [...prev.technologies, trimmed] }));
    setTechInput('');
  }

  function removeTechnology(tech: string) {
    setForm((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((item) => item !== tech),
    }));
  }

  function toggleDomain(domain: string) {
    setForm((prev) => ({
      ...prev,
      domains: prev.domains.includes(domain)
        ? prev.domains.filter((item) => item !== domain)
        : [...prev.domains, domain],
    }));
  }

  function toggleFocusArea(area: string) {
    setForm((prev) => ({
      ...prev,
      focus_areas: prev.focus_areas.includes(area)
        ? prev.focus_areas.filter((item) => item !== area)
        : [...prev.focus_areas, area],
    }));
  }

  async function submitProject() {
    if (pending || submitLockRef.current || completedRef.current) return;
    if (mode === 'create' && limitReached) return;
    if (mode === 'edit' && !projectId) return;

    submitLockRef.current = true;
    setClientError('');
    setRecoverableError('');

    const validation = validateProjectFormClient(form);
    if (!validation.success) {
      setClientError(validation.message);
      submitLockRef.current = false;
      return;
    }

    try {
      const payload =
        mode === 'edit'
          ? buildUpdateProjectFormData(projectId!, form)
          : buildCreateProjectFormData(form);
      await formAction(payload);
    } catch {
      setRecoverableError(
        'We could not reach the server. Your entries are still here — try again.',
      );
    } finally {
      submitLockRef.current = false;
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await submitProject();
  }

  async function handleRetry() {
    if (completedRef.current) {
      router.refresh();
      return;
    }
    await submitProject();
  }

  const fieldErrors = state.fieldErrors ?? {};
  const globalError =
    clientError ||
    (mode === 'create' && state.errorCode === 'limit' ? state.error : '') ||
    state.error ||
    (state.errorCode === 'auth' ? state.error : '') ||
    '';

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-[720px] space-y-8 pb-16"
      aria-busy={pending}
      noValidate
    >
      {usage?.limit != null && mode === 'create' && (
        <p className="rounded-[12px] border border-charcoal/70 bg-charcoal/30 px-4 py-3 text-[13px] text-lichen">
          {usage.count} of {usage.limit} projects used on the Free plan.
        </p>
      )}

      {limitReached && mode === 'create' && (
        <div className="rounded-[12px] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-vellum" role="alert">
          <p>{createState.error ?? `You've reached the ${usage?.limit}-project limit on the Free plan.`}</p>
          <Link href={createState.upgradeTo ?? '/dashboard/billing'} className="mt-2 inline-block font-medium text-reactorBright underline underline-offset-2">
            View upgrade options
          </Link>
        </div>
      )}
      <section className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="project-title" className="text-[13px] font-medium text-graphite">
            Project title <span className="text-reactor">*</span>
          </label>
          <input
            id="project-title"
            name="title"
            required
            value={form.title}
            onChange={(e) => updateTitle(e.target.value)}
            maxLength={PROJECT_FORM_LIMITS.title}
            className="cc-input w-full"
            placeholder="DevFlow"
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={fieldErrors.title ? 'project-title-error' : undefined}
          />
          <FieldError id="project-title-error" message={fieldErrors.title} />
        </div>

        <div className="space-y-2">
          <label htmlFor="project-slug" className="text-[13px] font-medium text-graphite">
            Project URL <span className="text-reactor">*</span>
          </label>
          <input
            id="project-slug"
            name="slug"
            required
            ref={slugInputRef}
            value={form.slug}
            onChange={(e) => updateSlug(e.target.value)}
            className="cc-input w-full"
            placeholder="dev-flow"
            aria-invalid={Boolean(fieldErrors.slug)}
            aria-describedby={fieldErrors.slug ? 'project-slug-error' : 'project-slug-hint'}
          />
          <p id="project-slug-hint" className="text-[12px] text-ash">
            Lowercase letters, numbers, and hyphens only.
          </p>
          <FieldError id="project-slug-error" message={fieldErrors.slug} />
        </div>

        <div className="space-y-2">
          <label htmlFor="project-tagline" className="text-[13px] font-medium text-graphite">
            Tagline <span className="text-ash">(optional)</span>
          </label>
          <input
            id="project-tagline"
            name="tagline"
            value={form.tagline}
            onChange={(e) => setForm((prev) => ({ ...prev, tagline: e.target.value }))}
            maxLength={PROJECT_FORM_LIMITS.tagline}
            className="cc-input w-full"
            placeholder="Ship faster with better workflows"
          />
          <FieldError id="project-tagline-error" message={fieldErrors.tagline} />
        </div>

        <div className="space-y-2">
          <label htmlFor="project-description" className="text-[13px] font-medium text-graphite">
            Description <span className="text-ash">(optional)</span>
          </label>
          <textarea
            id="project-description"
            name="description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            maxLength={PROJECT_FORM_LIMITS.description}
            rows={5}
            className="cc-input w-full resize-y"
            placeholder="What you built, why it matters, and what you learned."
          />
          <FieldError id="project-description-error" message={fieldErrors.description} />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <label htmlFor="project-technologies" className="text-[13px] font-medium text-graphite">
            Technologies
          </label>
          <p id="project-technologies-hint" className="text-[12px] text-ash">
            Add tools and languages, then press Enter.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="list" aria-label="Selected technologies">
          {form.technologies.map((tech) => (
            <span key={tech} className="cc-dash-tech-chip inline-flex items-center gap-2" role="listitem">
              {tech}
              <button
                type="button"
                className="text-ash hover:text-vellum"
                onClick={() => removeTechnology(tech)}
                aria-label={`Remove technology ${tech}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          id="project-technologies"
          value={techInput}
          onChange={(e) => setTechInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTechnology();
            }
          }}
          className="cc-input w-full"
          placeholder="TypeScript, Next.js, C++"
          aria-describedby="project-technologies-hint"
        />
        <FieldError id="project-technologies-error" message={fieldErrors.technologies} />
      </section>

      <fieldset className="space-y-3 border-0 p-0">
        <legend className="text-[13px] font-medium text-graphite">Domains</legend>
        <div className="flex flex-wrap gap-2">
          {PROJECT_FORM_DOMAIN_OPTIONS.map((domain) => (
            <ToggleChip
              key={domain}
              label={domain}
              selected={form.domains.includes(domain)}
              onToggle={() => toggleDomain(domain)}
            />
          ))}
        </div>
        <FieldError id="project-domains-error" message={fieldErrors.domains} />
      </fieldset>

      <fieldset className="space-y-3 border-0 p-0">
        <legend className="text-[13px] font-medium text-graphite">Focus areas</legend>
        <div className="flex flex-wrap gap-2">
          {PROJECT_FORM_FOCUS_AREA_OPTIONS.map((area) => (
            <ToggleChip
              key={area}
              label={area}
              selected={form.focus_areas.includes(area)}
              onToggle={() => toggleFocusArea(area)}
            />
          ))}
        </div>
        <FieldError id="project-focus-areas-error" message={fieldErrors.focus_areas} />
      </fieldset>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="project-user-role" className="text-[13px] font-medium text-graphite">
            Your role <span className="text-ash">(optional)</span>
          </label>
          <input
            id="project-user-role"
            name="user_role"
            value={form.user_role}
            onChange={(e) => setForm((prev) => ({ ...prev, user_role: e.target.value }))}
            maxLength={PROJECT_FORM_LIMITS.userRole}
            className="cc-input w-full"
            placeholder="Lead Engineer"
          />
          <FieldError id="project-user-role-error" message={fieldErrors.user_role} />
        </div>

        <div className="space-y-2">
          <label htmlFor="project-status" className="text-[13px] font-medium text-graphite">
            Lifecycle status
          </label>
          <select
            id="project-status"
            name="status"
            value={form.status}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                status: e.target.value as ProjectFormValues['status'],
              }))
            }
            className="cc-input w-full"
          >
            {PROJECT_FORM_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
          <FieldError id="project-status-error" message={fieldErrors.status} />
        </div>

        <div className="space-y-2">
          <label htmlFor="project-started-at" className="text-[13px] font-medium text-graphite">
            Started <span className="text-ash">(optional)</span>
          </label>
          <input
            id="project-started-at"
            name="started_at"
            type="date"
            value={form.started_at}
            onChange={(e) => setForm((prev) => ({ ...prev, started_at: e.target.value }))}
            className="cc-input w-full"
          />
          <FieldError id="project-started-at-error" message={fieldErrors.started_at} />
        </div>

        <div className="space-y-2">
          <label htmlFor="project-ended-at" className="text-[13px] font-medium text-graphite">
            Ended <span className="text-ash">(optional)</span>
          </label>
          <input
            id="project-ended-at"
            name="ended_at"
            type="date"
            value={form.ended_at}
            onChange={(e) => setForm((prev) => ({ ...prev, ended_at: e.target.value }))}
            className="cc-input w-full"
            aria-invalid={Boolean(fieldErrors.ended_at)}
            aria-describedby={fieldErrors.ended_at ? 'project-ended-at-error' : undefined}
          />
          <FieldError id="project-ended-at-error" message={fieldErrors.ended_at} />
        </div>
      </section>

      {recoverableError && (
        <div
          className="rounded-[12px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-vellum"
          role="alert"
          aria-live="polite"
        >
          <p>{recoverableError}</p>
          <button
            type="button"
            onClick={handleRetry}
            disabled={pending || limitReached || completedRef.current}
            className="mt-3 inline-flex h-9 items-center rounded-full border border-charcoal/70 px-4 text-[13px] text-vellum hover:border-graphite disabled:opacity-60"
          >
            Try again
          </button>
        </div>
      )}

      {globalError && !fieldErrors.slug && !fieldErrors.title && state.errorCode !== 'limit' && !recoverableError && (
        <p className="text-[13px] text-red-400" role="alert" aria-live="polite">
          {globalError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || (mode === 'create' && limitReached) || (mode === 'create' && completedRef.current)}
          className="cc-btn-pill-primary inline-flex h-11 items-center px-6 text-[14px] disabled:opacity-60"
        >
          {pending
            ? mode === 'edit'
              ? 'Saving changes…'
              : 'Creating project…'
            : mode === 'edit'
              ? 'Save changes'
              : 'Create project'}
        </button>
        <Link href="/dashboard/projects" className="cc-btn-pill-ghost inline-flex h-11 items-center px-6 text-[14px]">
          Cancel
        </Link>
      </div>
    </form>
  );
}
