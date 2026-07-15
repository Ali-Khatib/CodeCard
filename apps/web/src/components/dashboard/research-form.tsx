'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createResearchAction, type ResearchCreateState } from '@/app/actions/research';
import { handleSessionExpired } from '@/lib/auth/session-expiry';
import {
  buildCreateResearchFormData,
  createEmptyResearchFormValues,
  RESEARCH_FORM_LIMITS,
  suggestResearchSlugFromTitle,
  validateResearchFormClient,
  type ResearchFormMode,
  type ResearchFormValues,
} from '@/lib/research/research-form';
import { AppButton } from '@/components/dashboard/ui/dashboard-ui';
import { cn } from '@/lib/cn';

const initialCreateState: ResearchCreateState = {};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-[13px] text-red-600" role="alert">
      {message}
    </p>
  );
}

function GhostButton({
  children,
  onClick,
  disabled,
  ariaLabel,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'cc-app-btn cc-app-btn--ghost disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      {children}
    </button>
  );
}

export function ResearchForm({
  mode,
  initialValues,
}: {
  mode: ResearchFormMode;
  initialValues?: ResearchFormValues;
}) {
  const router = useRouter();
  const formId = useId();
  const slugInputRef = useRef<HTMLInputElement>(null);
  const submitLockRef = useRef(false);
  const completedRef = useRef(false);
  const [form, setForm] = useState<ResearchFormValues>(
    () => initialValues ?? createEmptyResearchFormValues(),
  );
  const [slugEdited, setSlugEdited] = useState(mode === 'edit' || Boolean(initialValues));
  const [clientError, setClientError] = useState('');
  const [createState, createAction, createPending] = useActionState(
    createResearchAction,
    initialCreateState,
  );

  const state = createState;
  const pending = createPending;
  const fieldErrors = state.fieldErrors ?? {};

  useEffect(() => {
    if (mode !== 'create' || !state.success || !state.redirectTo) return;
    completedRef.current = true;
    router.push(state.redirectTo);
  }, [mode, state, router]);

  useEffect(() => {
    if (state.errorCode === 'auth') {
      handleSessionExpired('/dashboard/research/new');
    }
  }, [state.errorCode]);

  useEffect(() => {
    if (state.errorCode === 'slug_taken' || state.fieldErrors?.slug) {
      slugInputRef.current?.focus();
    }
  }, [state.errorCode, state.fieldErrors?.slug]);

  function updateTitle(value: string) {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugEdited ? prev.slug : suggestResearchSlugFromTitle(value),
    }));
  }

  function updateAuthor(index: number, value: string) {
    setForm((prev) => {
      const authors = [...prev.authors];
      authors[index] = value;
      return { ...prev, authors };
    });
  }

  function addAuthor() {
    setForm((prev) => {
      if (prev.authors.length >= RESEARCH_FORM_LIMITS.authorsMax) return prev;
      return { ...prev, authors: [...prev.authors, ''] };
    });
  }

  function removeAuthor(index: number) {
    setForm((prev) => {
      if (prev.authors.length <= 1) {
        return { ...prev, authors: [''] };
      }
      return { ...prev, authors: prev.authors.filter((_, i) => i !== index) };
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (mode !== 'create') {
      event.preventDefault();
      return;
    }

    if (submitLockRef.current || pending || completedRef.current) {
      event.preventDefault();
      return;
    }

    const clientMessage = validateResearchFormClient(form);
    if (clientMessage) {
      event.preventDefault();
      setClientError(clientMessage);
      return;
    }

    setClientError('');
    submitLockRef.current = true;

    const fd = buildCreateResearchFormData(form);
    event.preventDefault();
    createAction(fd);
    window.setTimeout(() => {
      submitLockRef.current = false;
    }, 400);
  }

  if (mode === 'edit') {
    return (
      <p className="text-[15px] text-[var(--app-smoke)]" role="status">
        Research editing will be available in a later step.
      </p>
    );
  }

  const generalError = clientError || (!state.fieldErrors ? state.error : undefined);

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-[720px] space-y-6"
      aria-busy={pending}
      data-testid="research-form"
      noValidate
    >
      <div className="space-y-2">
        <label htmlFor={`${formId}-title`} className="block text-[14px] font-medium text-[var(--app-ink)]">
          Title
        </label>
        <input
          id={`${formId}-title`}
          name="title"
          value={form.title}
          onChange={(event) => updateTitle(event.target.value)}
          maxLength={RESEARCH_FORM_LIMITS.title}
          required
          aria-invalid={Boolean(fieldErrors.title)}
          aria-describedby={fieldErrors.title ? `${formId}-title-error` : undefined}
          className="w-full rounded-xl border border-[var(--app-border)] bg-white px-3 py-2.5 text-[15px] text-[var(--app-ink)]"
        />
        <FieldError id={`${formId}-title-error`} message={fieldErrors.title} />
      </div>

      <div className="space-y-2">
        <label htmlFor={`${formId}-slug`} className="block text-[14px] font-medium text-[var(--app-ink)]">
          URL slug
        </label>
        <input
          ref={slugInputRef}
          id={`${formId}-slug`}
          name="slug"
          value={form.slug}
          onChange={(event) => {
            setSlugEdited(true);
            setForm((prev) => ({ ...prev, slug: event.target.value }));
          }}
          required
          aria-invalid={Boolean(fieldErrors.slug)}
          aria-describedby={`${formId}-slug-help${fieldErrors.slug ? ` ${formId}-slug-error` : ''}`}
          className="w-full rounded-xl border border-[var(--app-border)] bg-white px-3 py-2.5 font-mono text-[14px] text-[var(--app-ink)]"
        />
        <p id={`${formId}-slug-help`} className="text-[13px] text-[var(--app-smoke)]">
          Preview: /research/{form.slug || 'your-paper'}
        </p>
        <FieldError id={`${formId}-slug-error`} message={fieldErrors.slug} />
      </div>

      <div className="space-y-2">
        <label htmlFor={`${formId}-abstract`} className="block text-[14px] font-medium text-[var(--app-ink)]">
          Abstract
        </label>
        <textarea
          id={`${formId}-abstract`}
          name="abstract"
          value={form.abstract}
          onChange={(event) => setForm((prev) => ({ ...prev, abstract: event.target.value }))}
          maxLength={RESEARCH_FORM_LIMITS.abstract}
          rows={5}
          aria-invalid={Boolean(fieldErrors.abstract)}
          aria-describedby={fieldErrors.abstract ? `${formId}-abstract-error` : undefined}
          className="w-full rounded-xl border border-[var(--app-border)] bg-white px-3 py-2.5 text-[15px] text-[var(--app-ink)]"
        />
        <FieldError id={`${formId}-abstract-error`} message={fieldErrors.abstract} />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-[14px] font-medium text-[var(--app-ink)]">Authors</legend>
        <p className="text-[13px] text-[var(--app-smoke)]">
          Plain-text author names only. Order is preserved. Max {RESEARCH_FORM_LIMITS.authorsMax}.
        </p>
        <ul className="space-y-2">
          {form.authors.map((author, index) => (
            <li key={`author-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor={`${formId}-author-${index}`}>
                Author {index + 1}
              </label>
              <input
                id={`${formId}-author-${index}`}
                value={author}
                onChange={(event) => updateAuthor(index, event.target.value)}
                maxLength={RESEARCH_FORM_LIMITS.author}
                placeholder={`Author ${index + 1}`}
                className="w-full flex-1 rounded-xl border border-[var(--app-border)] bg-white px-3 py-2.5 text-[15px]"
              />
              <GhostButton
                onClick={() => removeAuthor(index)}
                ariaLabel={`Remove author ${index + 1}`}
              >
                Remove
              </GhostButton>
            </li>
          ))}
        </ul>
        <GhostButton
          onClick={addAuthor}
          disabled={form.authors.length >= RESEARCH_FORM_LIMITS.authorsMax}
        >
          Add author
        </GhostButton>
        <FieldError id={`${formId}-authors-error`} message={fieldErrors.authors} />
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor={`${formId}-venue`} className="block text-[14px] font-medium text-[var(--app-ink)]">
            Venue
          </label>
          <input
            id={`${formId}-venue`}
            value={form.venue}
            onChange={(event) => setForm((prev) => ({ ...prev, venue: event.target.value }))}
            maxLength={RESEARCH_FORM_LIMITS.venue}
            className="w-full rounded-xl border border-[var(--app-border)] bg-white px-3 py-2.5 text-[15px]"
          />
          <FieldError id={`${formId}-venue-error`} message={fieldErrors.venue} />
        </div>
        <div className="space-y-2">
          <label htmlFor={`${formId}-year`} className="block text-[14px] font-medium text-[var(--app-ink)]">
            Year
          </label>
          <input
            id={`${formId}-year`}
            inputMode="numeric"
            value={form.year}
            onChange={(event) => setForm((prev) => ({ ...prev, year: event.target.value }))}
            placeholder="2017"
            aria-describedby={`${formId}-year-help`}
            aria-invalid={Boolean(fieldErrors.year)}
            className="w-full rounded-xl border border-[var(--app-border)] bg-white px-3 py-2.5 text-[15px]"
          />
          <p id={`${formId}-year-help`} className="text-[13px] text-[var(--app-smoke)]">
            Publication year only ({RESEARCH_FORM_LIMITS.yearMin}–{RESEARCH_FORM_LIMITS.yearMax}). Not filled
            automatically.
          </p>
          <FieldError id={`${formId}-year-error`} message={fieldErrors.year} />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor={`${formId}-publication-status`} className="block text-[14px] font-medium text-[var(--app-ink)]">
          Publication status
        </label>
        <input
          id={`${formId}-publication-status`}
          value={form.publication_status}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, publication_status: event.target.value }))
          }
          placeholder="Published, Under review, Preprint…"
          className="w-full rounded-xl border border-[var(--app-border)] bg-white px-3 py-2.5 text-[15px]"
        />
        <FieldError
          id={`${formId}-publication-status-error`}
          message={fieldErrors.publication_status}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={`${formId}-doi`} className="block text-[14px] font-medium text-[var(--app-ink)]">
          DOI
        </label>
        <input
          id={`${formId}-doi`}
          value={form.doi_url}
          onChange={(event) => setForm((prev) => ({ ...prev, doi_url: event.target.value }))}
          placeholder="10.xxxx/… or https://doi.org/…"
          aria-describedby={`${formId}-doi-help`}
          aria-invalid={Boolean(fieldErrors.doi_url)}
          className="w-full rounded-xl border border-[var(--app-border)] bg-white px-3 py-2.5 text-[15px]"
        />
        <p id={`${formId}-doi-help`} className="text-[13px] text-[var(--app-smoke)]">
          Optional. No remote DOI lookup is performed.
        </p>
        <FieldError id={`${formId}-doi-error`} message={fieldErrors.doi_url} />
      </div>

      <div className="space-y-2">
        <label htmlFor={`${formId}-pdf-url`} className="block text-[14px] font-medium text-[var(--app-ink)]">
          Paper URL
        </label>
        <input
          id={`${formId}-pdf-url`}
          type="url"
          value={form.pdf_url}
          onChange={(event) => setForm((prev) => ({ ...prev, pdf_url: event.target.value }))}
          placeholder="https://"
          aria-describedby={`${formId}-pdf-url-help`}
          aria-invalid={Boolean(fieldErrors.pdf_url)}
          className="w-full rounded-xl border border-[var(--app-border)] bg-white px-3 py-2.5 text-[15px]"
        />
        <p id={`${formId}-pdf-url-help`} className="text-[13px] text-[var(--app-smoke)]">
          Optional HTTPS link to a paper page or PDF. File upload comes later.
        </p>
        <FieldError id={`${formId}-pdf-url-error`} message={fieldErrors.pdf_url} />
      </div>

      <div className="space-y-2">
        <label htmlFor={`${formId}-citation`} className="block text-[14px] font-medium text-[var(--app-ink)]">
          Citation text
        </label>
        <textarea
          id={`${formId}-citation`}
          value={form.citation_text}
          onChange={(event) => setForm((prev) => ({ ...prev, citation_text: event.target.value }))}
          maxLength={RESEARCH_FORM_LIMITS.citation}
          rows={3}
          className="w-full rounded-xl border border-[var(--app-border)] bg-white px-3 py-2.5 text-[15px]"
        />
        <FieldError id={`${formId}-citation-error`} message={fieldErrors.citation_text} />
      </div>

      {generalError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[14px] text-red-700" role="alert">
          {generalError}
        </p>
      ) : null}

      <p className="text-[13px] text-[var(--app-smoke)]" role="status" aria-live="polite">
        {pending ? 'Creating research paper…' : 'New papers stay unpublished until you choose to publish later.'}
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="cc-app-btn cc-app-btn--primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Creating…' : 'Create research paper'}
        </button>
        <AppButton href="/dashboard/research">Cancel</AppButton>
      </div>
    </form>
  );
}
