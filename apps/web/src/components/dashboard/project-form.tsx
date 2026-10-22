'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ProjectCreateState, ProjectUpdateState } from '@/app/actions/projects';
import { postOwnedForm } from '@/lib/dashboard/post-owned-form';
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
import { CASE_STUDY_SECTIONS } from '@/lib/projects/case-study-sections';
import type { CaseStudySectionId } from '@/lib/projects/case-study-sections.shared';
import {
  CASE_STUDY_IMAGE_ACCEPT,
  compressCaseStudyImage,
} from '@/lib/projects/case-study-image';
import { cn } from '@/lib/cn';
import { joinDescribedBy } from '@/lib/a11y/described-by';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';

const PROJECT_FIELD_IDS: Record<string, string> = {
  title: 'project-title',
  slug: 'project-slug',
  tagline: 'project-tagline',
  description: 'project-description',
  technologies: 'project-technologies',
  domains: 'project-domains',
  focus_areas: 'project-focus-areas',
  user_role: 'project-user-role',
  status: 'project-status',
  started_at: 'project-started-at',
  ended_at: 'project-ended-at',
};

function focusProjectField(field?: string) {
  if (!field) return;
  const id = PROJECT_FIELD_IDS[field];
  if (!id) return;
  const el = document.getElementById(id);
  if (el instanceof HTMLElement) el.focus();
}

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
        'cc-app-toggle-chip',
        selected ? 'cc-app-toggle-chip--selected' : undefined,
      )}
    >
      {label}
    </button>
  );
}

function ChipGroup({
  legend,
  options,
  selected,
  onChange,
  listId,
  inputId,
  error,
  errorId,
}: {
  legend: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  listId: string;
  inputId: string;
  error?: string;
  errorId: string;
}) {
  const [otherOpen, setOtherOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [localError, setLocalError] = useState('');
  const optionSet = new Set<string>(options);
  const custom = selected.filter((item) => !optionSet.has(item));

  function toggle(label: string) {
    onChange(selected.includes(label) ? selected.filter((item) => item !== label) : [...selected, label]);
  }

  function addCustom() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (trimmed.length > 40) {
      setLocalError('Keep it to 40 characters.');
      return;
    }
    const canonical = options.find((option) => option.toLowerCase() === trimmed.toLowerCase());
    const label = canonical ?? trimmed;
    if (selected.some((item) => item.toLowerCase() === label.toLowerCase())) {
      setDraft('');
      setLocalError('');
      return;
    }
    if (selected.length >= 10) {
      setLocalError('You can choose up to 10.');
      return;
    }
    onChange([...selected, label]);
    setDraft('');
    setLocalError('');
  }

  return (
    <fieldset
      className="space-y-3 border-0 p-0"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="cc-app-field-label text-[17px]">{legend}</legend>
      <p className="cc-project-form__hint">Choose any that fit, or add your own.</p>
      <div id={listId} className="flex flex-wrap gap-2">
        {options.map((option) => (
          <ToggleChip
            key={option}
            label={option}
            selected={selected.includes(option)}
            onToggle={() => toggle(option)}
          />
        ))}
        {custom.map((label) => (
          <ToggleChip key={label} label={label} selected onToggle={() => toggle(label)} />
        ))}
        <ToggleChip label="Other" selected={otherOpen} onToggle={() => setOtherOpen((open) => !open)} />
      </div>
      {otherOpen ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            id={inputId}
            value={draft}
            maxLength={40}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addCustom();
              }
            }}
            className="cc-input min-w-[12rem] flex-1"
            placeholder="Write your own"
            aria-label={`${legend} other`}
          />
          <button type="button" className="cc-app-btn cc-app-btn--primary shrink-0" onClick={addCustom}>
            Add
          </button>
        </div>
      ) : null}
      {localError ? (
        <p className="text-sm text-red-600" role="alert">
          {localError}
        </p>
      ) : null}
      <FieldError id={errorId} message={error} />
    </fieldset>
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
  const [stillInProgress, setStillInProgress] = useState(
    () => !(initialValues ?? createEmptyProjectFormValues()).ended_at,
  );
  const [slugEdited, setSlugEdited] = useState(mode === 'edit' || Boolean(initialValues));
  const [techInput, setTechInput] = useState('');
  const [sectionImageErrors, setSectionImageErrors] = useState<
    Partial<Record<CaseStudySectionId, string>>
  >({});
  const [sectionImageBusy, setSectionImageBusy] = useState<
    Partial<Record<CaseStudySectionId, boolean>>
  >({});
  const [clientError, setClientError] = useState('');
  const [clientFieldError, setClientFieldError] = useState<{
    field?: string;
    message: string;
  } | null>(null);
  const [recoverableError, setRecoverableError] = useState('');
  const [createState, setCreateState] = useState<ProjectCreateState>(initialCreateState);
  const [updateState, setUpdateState] = useState<ProjectUpdateState>(initialUpdateState);
  const [pending, setPending] = useState(false);

  const state = mode === 'edit' ? updateState : createState;
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
    }
  }, [mode, state, router, notifySuccess]);

  useEffect(() => {
    if (state.errorCode === 'auth') {
      handleSessionExpired(editPath);
      notifyError(MUTATION_FEEDBACK.sessionExpired);
    }
  }, [state.errorCode, editPath, notifyError]);

  useEffect(() => {
    const errors = state.fieldErrors ?? {};
    const firstKey = Object.keys(errors)[0];
    if (state.errorCode === 'slug_taken') {
      slugInputRef.current?.focus();
      return;
    }
    if (firstKey) {
      focusProjectField(firstKey);
    }
  }, [state.errorCode, state.fieldErrors]);

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

  async function submitProject() {
    if (pending || submitLockRef.current || completedRef.current) return;
    if (mode === 'create' && limitReached) return;
    if (mode === 'edit' && !projectId) return;

    submitLockRef.current = true;
    setClientError('');
    setClientFieldError(null);
    setRecoverableError('');

    const validation = validateProjectFormClient(form);
    if (!validation.success) {
      setClientError(validation.message);
      setClientFieldError({ field: validation.field, message: validation.message });
      submitLockRef.current = false;
      focusProjectField(validation.field);
      return;
    }

    setPending(true);
    try {
      const payload =
        mode === 'edit'
          ? buildUpdateProjectFormData(projectId!, form)
          : buildCreateProjectFormData(form);
      const result = await postOwnedForm<ProjectCreateState | ProjectUpdateState>(
        mode === 'edit' ? '/api/projects?op=update' : '/api/projects?op=create',
        payload,
      );
      notifiedSuccessRef.current = false;
      if (mode === 'edit') setUpdateState(result as ProjectUpdateState);
      else setCreateState(result as ProjectCreateState);
    } catch {
      setRecoverableError(
        'We could not reach the server. Your entries are still here — try again.',
      );
    } finally {
      submitLockRef.current = false;
      setPending(false);
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

  const fieldErrors = {
    ...(state.fieldErrors ?? {}),
    ...(clientFieldError?.field
      ? { [clientFieldError.field]: clientFieldError.message }
      : {}),
  };
  const globalError =
    clientError ||
    (mode === 'create' && state.errorCode === 'limit' ? state.error : '') ||
    state.error ||
    (state.errorCode === 'auth' ? state.error : '') ||
    '';
  const formErrorId = 'project-form-error';

  return (
    <form
      onSubmit={handleSubmit}
      className="cc-project-form mx-auto w-full max-w-[720px] space-y-8 pb-16"
      aria-busy={pending}
      noValidate
    >
      {usage?.limit != null && mode === 'create' && (
        <div
          className={`cc-plan-meter${usage.count >= usage.limit ? ' is-full' : ''}`}
          role="meter"
          aria-valuemin={0}
          aria-valuemax={usage.limit}
          aria-valuenow={usage.count}
          aria-label={`${usage.count} of ${usage.limit} projects used on the Free plan`}
        >
          <div className="cc-plan-meter__row">
            <span>Free plan</span>
            <span>
              {usage.count} of {usage.limit} projects
            </span>
          </div>
          <div className="cc-plan-meter__track">
            <div
              className="cc-plan-meter__fill"
              style={{ width: `${Math.min(100, Math.round((usage.count / usage.limit) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {limitReached && mode === 'create' && (
        <div className="rounded-[12px] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[16px] text-[var(--app-ink)]" role="alert">
          <p>{createState.error ?? `You've reached the ${usage?.limit}-project limit on the Free plan.`}</p>
          <Link href={createState.upgradeTo ?? '/dashboard/billing'} className="mt-2 inline-block font-medium text-[var(--app-ink)] underline underline-offset-2">
            View upgrade options
          </Link>
        </div>
      )}

      <section className="space-y-5" aria-labelledby="project-required-heading">
        <h2 id="project-required-heading" className="text-[22px] font-semibold text-[var(--app-ink)]">
          Name and link
        </h2>
        <div className="space-y-2">
          <label htmlFor="project-title" className="text-[17px] font-semibold text-[var(--app-ink)]">
            Project title <abbr className="cc-req" title="Required">*</abbr>
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
          <label htmlFor="project-slug" className="text-[17px] font-semibold text-[var(--app-ink)]">
            Project URL <abbr className="cc-req" title="Required">*</abbr>
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
            aria-describedby={joinDescribedBy(
              'project-slug-hint',
              fieldErrors.slug && 'project-slug-error',
            )}
          />
          <p id="project-slug-hint" className="cc-project-form__note">
            Lowercase letters, numbers, and hyphens only. This becomes the project link.
          </p>
          <FieldError id="project-slug-error" message={fieldErrors.slug} />
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="project-showcase-heading">
        <div>
          <h2 id="project-showcase-heading" className="text-[22px] font-semibold text-[var(--app-ink)]">
            Story
          </h2>
          <p id="project-showcase-help" className="cc-project-form__hint mt-2">
            These become tabs on the project page. Add the ones you want, and skip the rest.
          </p>
        </div>
        <div className="space-y-4">
          {CASE_STUDY_SECTIONS.map((section) => {
            const enabled = Object.prototype.hasOwnProperty.call(
              form.case_study_sections,
              section.id,
            );
            const fieldId = `case_study_${section.id}`;
            const helpId = `${fieldId}-help`;
            const promptId = `${fieldId}-prompt`;
            const imageInputId = `${fieldId}-image`;
            const imageHelpId = `${fieldId}-image-help`;
            const sectionImage = form.case_study_sections[section.id]?.mediaUrl ?? '';
            const imageError = sectionImageErrors[section.id] ?? '';
            const imageBusy = Boolean(sectionImageBusy[section.id]);
            return (
              <div
                key={section.id}
                className="rounded-[16px] border border-charcoal/70 bg-charcoal/20 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold text-[var(--app-ink)]">{section.label}</p>
                    <p className="cc-project-form__hint mt-1">{section.addHint}</p>
                  </div>
                  <button
                    type="button"
                    className={cn(
                      'cc-app-btn min-h-11 shrink-0 px-4 text-[13px]',
                      enabled ? 'cc-app-btn--ghost' : 'cc-app-btn--primary',
                    )}
                    aria-pressed={enabled}
                    onClick={() => {
                      setForm((prev) => {
                        const next = { ...prev.case_study_sections };
                        if (enabled) {
                          delete next[section.id];
                        } else {
                          next[section.id] = { text: '' };
                        }
                        return { ...prev, case_study_sections: next };
                      });
                      setSectionImageErrors((prev) => ({ ...prev, [section.id]: '' }));
                    }}
                  >
                    {enabled ? 'Remove tab' : 'Add tab'}
                  </button>
                </div>
                {enabled ? (
                  <div className="mt-4 space-y-2">
                    <label htmlFor={fieldId} className="text-[13px] font-medium text-graphite">
                      {section.label} text
          </label>
                    <p id={promptId} className="cc-project-form__hint">
                      {section.prompt}
                    </p>
                    <textarea
                      id={fieldId}
                      name={fieldId}
                      rows={4}
                      maxLength={PROJECT_FORM_LIMITS.caseStudySection}
                      value={form.case_study_sections[section.id]?.text ?? ''}
                      onChange={(e) => {
                        const text = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          case_study_sections: {
                            ...prev.case_study_sections,
                            [section.id as CaseStudySectionId]: {
                              ...prev.case_study_sections[section.id],
                              text,
                            },
                          },
                        }));
                      }}
                      className="cc-input w-full resize-y"
                      placeholder={section.placeholder}
                      aria-describedby={joinDescribedBy(promptId, helpId)}
                    />
                    <p id={helpId} className="cc-project-form__note">
                      Aim for 2 to 4 sentences. Max {PROJECT_FORM_LIMITS.caseStudySection} characters.
                    </p>

                    <div className="mt-3 space-y-2 border-t border-charcoal/60 pt-3">
                      <label
                        htmlFor={imageInputId}
                        className="text-[13px] font-medium text-graphite"
                      >
                        Background image <span className="text-ash">(optional)</span>
            </label>
                      <p id={imageHelpId} className="cc-project-form__hint">
                        Background for this tab. JPEG, PNG, or WebP.
                      </p>
                      {sectionImage ? (
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Bounded data-URL preview generated client-side. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sectionImage}
                            alt={`${section.label} background preview`}
                            className="h-16 w-28 rounded-[10px] border border-charcoal/70 object-cover"
                          />
                          <button
                            type="button"
                            className="cc-app-btn cc-app-btn--ghost min-h-11 px-4 text-[13px]"
                            onClick={() => {
                              setForm((prev) => {
                                const current = prev.case_study_sections[section.id];
                                const next = { ...current };
                                delete next.mediaUrl;
                                return {
                                  ...prev,
                                  case_study_sections: {
                                    ...prev.case_study_sections,
                                    [section.id as CaseStudySectionId]: next,
                                  },
                                };
                              });
                              setSectionImageErrors((prev) => ({ ...prev, [section.id]: '' }));
                            }}
                          >
                            Remove image
                          </button>
                        </div>
                      ) : (
                        <input
                          id={imageInputId}
                          type="file"
                          accept={CASE_STUDY_IMAGE_ACCEPT}
                          disabled={imageBusy}
                          aria-describedby={imageHelpId}
                          className="cc-project-form__file block w-full text-[14px] text-[var(--app-ink)] file:mr-3 file:inline-flex file:min-h-11 file:cursor-pointer file:items-center file:rounded-full file:border file:border-[var(--app-ink)] file:bg-[var(--app-ink)] file:px-4 file:py-2 file:text-[14px] file:font-semibold file:text-[var(--app-paper)]"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (!file) return;
                            setSectionImageErrors((prev) => ({ ...prev, [section.id]: '' }));
                            setSectionImageBusy((prev) => ({ ...prev, [section.id]: true }));
                            const result = await compressCaseStudyImage(file);
                            setSectionImageBusy((prev) => ({ ...prev, [section.id]: false }));
                            if (!result.ok) {
                              setSectionImageErrors((prev) => ({
                                ...prev,
                                [section.id]: result.message,
                              }));
                              return;
                            }
                            setForm((prev) => ({
                              ...prev,
                              case_study_sections: {
                                ...prev.case_study_sections,
                                [section.id as CaseStudySectionId]: {
                                  ...prev.case_study_sections[section.id],
                                  mediaUrl: result.dataUrl,
                                },
                              },
                            }));
                          }}
                        />
                      )}
                      {imageBusy ? (
                        <p className="text-[12px] text-ash" role="status">
                          Preparing image…
                        </p>
                      ) : null}
                      <FieldError id={`${imageInputId}-error`} message={imageError || undefined} />
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <FieldError id="project-case-study-error" message={fieldErrors.case_study_sections} />
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="project-tagline" className="text-[17px] font-semibold text-[var(--app-ink)]">
            Tagline</label>
          <input
            id="project-tagline"
            name="tagline"
            value={form.tagline}
            onChange={(e) => setForm((prev) => ({ ...prev, tagline: e.target.value }))}
            maxLength={PROJECT_FORM_LIMITS.tagline}
            className="cc-input w-full"
            placeholder="Ship faster with better workflows"
            aria-invalid={Boolean(fieldErrors.tagline)}
            aria-describedby={
              fieldErrors.tagline ? 'project-tagline-error' : undefined
            }
          />
          <FieldError id="project-tagline-error" message={fieldErrors.tagline} />
        </div>

        <div className="space-y-2">
          <label htmlFor="project-description" className="text-[17px] font-semibold text-[var(--app-ink)]">
            Description</label>
          <textarea
            id="project-description"
            name="description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            maxLength={PROJECT_FORM_LIMITS.description}
            rows={5}
            className="cc-input w-full resize-y"
            placeholder="What you built, why it matters, and what you learned."
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby={
              fieldErrors.description ? 'project-description-error' : undefined
            }
          />
          <FieldError id="project-description-error" message={fieldErrors.description} />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <label htmlFor="project-technologies" className="text-[17px] font-semibold text-[var(--app-ink)]">
            Technologies</label>
          <p id="project-technologies-hint" className="cc-project-form__hint mt-1">
            Type a tool or language, then press Add. Enter works too.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="list" aria-label="Selected technologies">
          {form.technologies.map((tech) => (
            <span key={tech} className="cc-dash-tech-chip inline-flex items-center gap-2" role="listitem">
              {tech}
              <button
                type="button"
                className="cc-project-form__chip-remove"
                onClick={() => removeTechnology(tech)}
                aria-label={`Remove technology ${tech}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="cc-project-form__tech">
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
            className="cc-input min-w-[12rem] flex-1"
            placeholder="TypeScript, Next.js, C++"
            aria-invalid={Boolean(fieldErrors.technologies)}
            aria-describedby={joinDescribedBy(
              'project-technologies-hint',
              fieldErrors.technologies && 'project-technologies-error',
            )}
          />
          <button type="button" className="cc-app-btn cc-app-btn--primary shrink-0" onClick={addTechnology}>
            Add
          </button>
        </div>
        <FieldError id="project-technologies-error" message={fieldErrors.technologies} />
      </section>

      <ChipGroup
        legend="Domains"
        options={PROJECT_FORM_DOMAIN_OPTIONS}
        selected={form.domains}
        onChange={(domains) => setForm((prev) => ({ ...prev, domains }))}
        listId="project-domains"
        inputId="project-domain-other"
        error={fieldErrors.domains}
        errorId="project-domains-error"
      />

      <ChipGroup
        legend="Focus areas"
        options={PROJECT_FORM_FOCUS_AREA_OPTIONS}
        selected={form.focus_areas}
        onChange={(focus_areas) => setForm((prev) => ({ ...prev, focus_areas }))}
        listId="project-focus-areas"
        inputId="project-focus-other"
        error={fieldErrors.focus_areas}
        errorId="project-focus-areas-error"
      />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="project-user-role" className="text-[17px] font-semibold text-[var(--app-ink)]">
            Your role</label>
          <input
            id="project-user-role"
            name="user_role"
            value={form.user_role}
            onChange={(e) => setForm((prev) => ({ ...prev, user_role: e.target.value }))}
            maxLength={PROJECT_FORM_LIMITS.userRole}
            className="cc-input w-full"
            placeholder="Lead Engineer"
            aria-invalid={Boolean(fieldErrors.user_role)}
            aria-describedby={
              fieldErrors.user_role ? 'project-user-role-error' : undefined
            }
          />
          <FieldError id="project-user-role-error" message={fieldErrors.user_role} />
        </div>

        <div className="space-y-2">
          <label htmlFor="project-status" className="text-[17px] font-semibold text-[var(--app-ink)]">
            Lifecycle status</label>
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
            aria-invalid={Boolean(fieldErrors.status)}
            aria-describedby={fieldErrors.status ? 'project-status-error' : undefined}
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
          <label htmlFor="project-started-at" className="text-[17px] font-semibold text-[var(--app-ink)]">
            Started</label>
          <input
            id="project-started-at"
            name="started_at"
            type="date"
            value={form.started_at}
            onChange={(e) => setForm((prev) => ({ ...prev, started_at: e.target.value }))}
            className="cc-input w-full"
            aria-invalid={Boolean(fieldErrors.started_at)}
            aria-describedby={
              fieldErrors.started_at ? 'project-started-at-error' : undefined
            }
          />
          <FieldError id="project-started-at-error" message={fieldErrors.started_at} />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="project-ended-at" className="text-[17px] font-semibold text-[var(--app-ink)]">
              Ended
            </label>
            <label className="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--app-ink)]">
              <input
                type="checkbox"
                className="size-4 accent-[var(--app-ink)]"
                checked={stillInProgress}
                onChange={(e) => {
                  const on = e.target.checked;
                  setStillInProgress(on);
                  if (on) setForm((prev) => ({ ...prev, ended_at: '' }));
                }}
              />
              Still in progress
            </label>
          </div>
          <input
            id="project-ended-at"
            name="ended_at"
            type="date"
            value={stillInProgress ? '' : form.ended_at}
            disabled={stillInProgress}
            onChange={(e) => setForm((prev) => ({ ...prev, ended_at: e.target.value }))}
            className="cc-input w-full disabled:cursor-not-allowed disabled:opacity-50"
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

      {globalError &&
        !fieldErrors.slug &&
        !fieldErrors.title &&
        state.errorCode !== 'limit' &&
        !recoverableError && (
        <p
          id={formErrorId}
          className="text-[13px] text-red-400"
          role="alert"
          aria-live="assertive"
        >
          {globalError}
        </p>
      )}
      {clientError && (fieldErrors.slug || fieldErrors.title) && !recoverableError && (
        <p id={formErrorId} className="sr-only" role="alert">
          {clientError}
        </p>
      )}

      <div className="cc-project-form__actions">
        <button
          type="submit"
          disabled={pending || (mode === 'create' && limitReached) || (mode === 'create' && completedRef.current)}
          className="cc-app-btn cc-app-btn--primary cc-project-form__submit"
        >
          {pending
            ? mode === 'edit'
              ? 'Saving changes…'
              : 'Creating project…'
            : mode === 'edit'
              ? 'Save changes'
              : 'Create project'}
        </button>
        <Link href="/dashboard/projects" className="cc-app-btn cc-app-btn--ghost cc-project-form__cancel">
          Cancel
        </Link>
      </div>
    </form>
  );
}
