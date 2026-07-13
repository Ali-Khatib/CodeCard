'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createProjectAction, type ProjectCreateState } from '@/app/actions/projects';
import {
  buildCreateProjectFormData,
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

const initialState: ProjectCreateState = {};

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
}: {
  mode: ProjectFormMode;
  initialUsage?: { count: number; limit: number | null } | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProjectFormValues>(() => createEmptyProjectFormValues());
  const [slugEdited, setSlugEdited] = useState(false);
  const [techInput, setTechInput] = useState('');
  const [clientError, setClientError] = useState('');
  const [state, formAction, pending] = useActionState(createProjectAction, initialState);

  const usage = state.usage ?? initialUsage;
  const limitReached =
    usage?.limit != null && usage.count >= usage.limit;

  useEffect(() => {
    if (!state.success || !state.redirectTo) return;
    router.push(state.redirectTo);
  }, [state.success, state.redirectTo, router]);

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending || mode !== 'create' || limitReached) return;
    setClientError('');

    const validation = validateProjectFormClient(form);
    if (!validation.success) {
      setClientError(validation.message);
      return;
    }

    formAction(buildCreateProjectFormData(form));
  }

  const fieldErrors = state.fieldErrors ?? {};
  const globalError =
    clientError ||
    (state.errorCode === 'limit' ? state.error : '') ||
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
      {usage?.limit != null && (
        <p className="rounded-[12px] border border-charcoal/70 bg-charcoal/30 px-4 py-3 text-[13px] text-lichen">
          {usage.count} of {usage.limit} projects used on the Free plan.
        </p>
      )}

      {limitReached && (
        <div className="rounded-[12px] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-vellum" role="alert">
          <p>{state.error ?? `You've reached the ${usage?.limit}-project limit on the Free plan.`}</p>
          <Link href={state.upgradeTo ?? '/dashboard/billing'} className="mt-2 inline-block font-medium text-reactorBright underline underline-offset-2">
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
          <p className="text-[13px] font-medium text-graphite">Technologies</p>
          <p className="text-[12px] text-ash">Add tools and languages, then press Enter.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.technologies.map((tech) => (
            <span key={tech} className="cc-dash-tech-chip inline-flex items-center gap-2">
              {tech}
              <button
                type="button"
                className="text-ash hover:text-vellum"
                onClick={() => removeTechnology(tech)}
                aria-label={`Remove ${tech}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
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
          aria-label="Add technology"
        />
        <FieldError id="project-technologies-error" message={fieldErrors.technologies} />
      </section>

      <section className="space-y-3">
        <p className="text-[13px] font-medium text-graphite">Domains</p>
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
      </section>

      <section className="space-y-3">
        <p className="text-[13px] font-medium text-graphite">Focus areas</p>
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
      </section>

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

      {globalError && !fieldErrors.slug && !fieldErrors.title && state.errorCode !== 'limit' && (
        <p className="text-[13px] text-red-400" role="alert">
          {globalError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || limitReached}
          className="cc-btn-pill-primary inline-flex h-11 items-center px-6 text-[14px] disabled:opacity-60"
        >
          {pending ? 'Creating project…' : 'Create project'}
        </button>
        <Link href="/dashboard/projects" className="cc-btn-pill-ghost inline-flex h-11 items-center px-6 text-[14px]">
          Cancel
        </Link>
      </div>
    </form>
  );
}
