'use client';

import { useEffect, useMemo, useState, useTransition, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { PROFILE_LINK_TYPES, profileLinkUrlHelp, profileLinkUrlPlaceholder } from '@codecard/validation';
import type { ProfileLinkRow } from '@/lib/profile/profile-link-core';
import {
  createProfileLinkAction,
  deleteProfileLinkAction,
  moveProfileLinkAction,
  updateProfileLinkAction,
  type ProfileLinkMutationState,
} from '@/lib/profile/profile-link-actions';
import { getProfileLinkAria, resolveProfileLinkIcon } from '@/lib/icons/profile-links';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';

type ProfileLinksEditorProps = {
  links: ProfileLinkRow[];
};

type EditorMode =
  | { kind: 'idle' }
  | { kind: 'add' }
  | { kind: 'edit'; link: ProfileLinkRow };

const emptyForm = { type: 'website', label: '', url: '' };

export function ProfileLinksEditor({ links }: ProfileLinksEditorProps) {
  const router = useRouter();
  const { notifySuccess, notifyError } = useMutationFeedback();
  const [mode, setMode] = useState<EditorMode>({ kind: 'idle' });
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ProfileLinkMutationState['fieldErrors']>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [createState, createAction, createPending] = useActionState(createProfileLinkAction, {});
  const [updateState, updateAction, updatePending] = useActionState(updateProfileLinkAction, {});
  const [isPending, startTransition] = useTransition();

  const sortedLinks = useMemo(
    () => [...links].sort((a, b) => a.sort_order - b.sort_order),
    [links],
  );

  function resetEditor() {
    setMode({ kind: 'idle' });
    setForm(emptyForm);
    setError('');
    setFieldErrors({});
  }

  function openAdd() {
    setMode({ kind: 'add' });
    setForm(emptyForm);
    setError('');
    setFieldErrors({});
  }

  function openEdit(link: ProfileLinkRow) {
    setMode({ kind: 'edit', link });
    setForm({
      type: link.type,
      label: link.label ?? '',
      url: link.url.startsWith('mailto:') ? link.url.replace(/^mailto:/i, '') : link.url,
    });
    setError('');
    setFieldErrors({});
  }

  useEffect(() => {
    const state = mode.kind === 'edit' ? updateState : createState;
    if (!state.success && !state.error && !state.fieldErrors) return;
    if (state.success) {
      resetEditor();
      notifySuccess(
        mode.kind === 'edit'
          ? MUTATION_FEEDBACK.profile.linkUpdated
          : MUTATION_FEEDBACK.profile.linkAdded,
      );
      router.refresh();
      return;
    }
    if (state.error) {
      setError(state.error);
      if (!state.fieldErrors) {
        notifyError(state.error, MUTATION_FEEDBACK.profile.linkFailed);
      }
    }
    if (state.fieldErrors) setFieldErrors(state.fieldErrors);
  }, [createState, updateState, mode.kind, router, notifySuccess, notifyError]);

  function submitLink(e: React.FormEvent) {
    e.preventDefault();
    if (createPending || updatePending) return;
    setError('');
    setFieldErrors({});

    const fd = new FormData();
    fd.set('type', form.type);
    fd.set('label', form.label);
    fd.set('url', form.url);
    if (mode.kind === 'edit') {
      fd.set('link_id', mode.link.id);
      startTransition(() => {
        updateAction(fd);
      });
      return;
    }
    startTransition(() => {
      createAction(fd);
    });
  }

  function handleDelete(link: ProfileLinkRow) {
    if (pendingAction) return;
    if (!window.confirm('Delete this profile link?')) return;
    setPendingAction(`delete:${link.id}`);
    startTransition(async () => {
      const result = await deleteProfileLinkAction(link.id);
      if (result.error) {
        setError(result.error);
        notifyError(result.error, MUTATION_FEEDBACK.profile.linkFailed);
      } else {
        notifySuccess(MUTATION_FEEDBACK.profile.linkDeleted);
        router.refresh();
      }
      setPendingAction(null);
    });
  }

  function handleMove(link: ProfileLinkRow, direction: 'up' | 'down') {
    if (pendingAction) return;
    setPendingAction(`move:${link.id}:${direction}`);
    startTransition(async () => {
      const result = await moveProfileLinkAction(link.id, direction);
      if (result.error) {
        setError(result.error);
        notifyError(result.error, MUTATION_FEEDBACK.profile.linkFailed);
      } else {
        notifySuccess(MUTATION_FEEDBACK.profile.linkOrderUpdated);
        router.refresh();
      }
      setPendingAction(null);
    });
  }

  return (
    <section
      id="links"
      className="space-y-4 scroll-mt-28 rounded-[16px] border border-[var(--app-border)] bg-[var(--app-paper)] p-5"
      aria-label="Profile links"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-medium text-[var(--app-ink)]">Profile links</h3>
          <p className="mt-1 text-[13px] text-[var(--app-smoke)]">
            GitHub, LinkedIn, and X must use the matching site URL. A personal website is optional.
          </p>
        </div>
        {mode.kind === 'idle' ? (
          <button type="button" className="cc-app-btn cc-app-btn--ghost" onClick={openAdd}>
            Add link
          </button>
        ) : null}
      </div>

      <div aria-live="polite">
        {isPending ? (
          <p className="text-sm text-[var(--app-smoke)]" role="status">
            Updating links…
          </p>
        ) : null}
      </div>

      {sortedLinks.length === 0 && mode.kind === 'idle' ? (
        <p className="text-sm text-[var(--app-smoke)]">
          No links yet. Add GitHub, LinkedIn, your website, or email so people can reach you faster.
        </p>
      ) : (
        <ul className="space-y-3">
          {sortedLinks.map((link, index) => {
            const Icon = resolveProfileLinkIcon(link.type);
            const busy =
              pendingAction?.startsWith(`move:${link.id}`) || pendingAction === `delete:${link.id}`;
            return (
              <li
                key={link.id}
                className="flex flex-col gap-3 rounded-[12px] border border-[var(--app-border)] bg-[var(--app-bone)]/35 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="cc-public-social-chip flex h-9 w-9 items-center justify-center !shadow-none">
                    <Icon className="cc-public-social-chip__icon text-sm" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--app-ink)]">
                      {getProfileLinkAria(link.type, link.label)}
                    </p>
                    <p className="truncate text-xs text-[var(--app-smoke)]">{link.url}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="cc-app-btn cc-app-btn--ghost"
                    disabled={busy || index === 0 || isPending}
                    aria-busy={busy}
                    onClick={() => handleMove(link, 'up')}
                    aria-label={`Move ${getProfileLinkAria(link.type, link.label)} up`}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="cc-app-btn cc-app-btn--ghost"
                    disabled={busy || index === sortedLinks.length - 1 || isPending}
                    aria-busy={busy}
                    onClick={() => handleMove(link, 'down')}
                    aria-label={`Move ${getProfileLinkAria(link.type, link.label)} down`}
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    className="cc-app-btn cc-app-btn--ghost"
                    disabled={busy}
                    onClick={() => openEdit(link)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="cc-app-btn cc-app-btn--ghost text-[var(--app-error)]"
                    disabled={busy}
                    aria-busy={busy}
                    onClick={() => handleDelete(link)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {mode.kind !== 'idle' ? (
        <form onSubmit={submitLink} className="space-y-4 border-t border-[var(--app-border)] pt-4">
          <h4 className="text-[14px] font-medium text-[var(--app-ink)]">
            {mode.kind === 'edit' ? 'Edit link' : 'Add link'}
          </h4>
          <div className="space-y-2">
            <label htmlFor="profile-link-type" className="cc-app-field-label">
              Type
            </label>
            <select
              id="profile-link-type"
              className="cc-app-input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              aria-describedby="profile-link-type-help"
            >
              {PROFILE_LINK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === 'twitter' ? 'X (Twitter)' : type}
                </option>
              ))}
            </select>
            <p id="profile-link-type-help" className="text-xs text-[var(--app-smoke)]">
              Pick the network first so we can check the URL matches. Website and X are optional.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="profile-link-label" className="cc-app-field-label">
              Label (optional)
            </label>
            <input
              id="profile-link-label"
              className="cc-app-input"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              aria-invalid={Boolean(fieldErrors?.label)}
              aria-describedby={fieldErrors?.label ? 'profile-link-label-error' : undefined}
            />
            {fieldErrors?.label ? (
              <p id="profile-link-label-error" className="text-sm text-[var(--app-error)]" role="alert">
                {fieldErrors.label}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label htmlFor="profile-link-url" className="cc-app-field-label">
              {form.type === 'email' ? 'Email' : 'URL'}
            </label>
            <input
              id="profile-link-url"
              className="cc-app-input"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              aria-invalid={Boolean(fieldErrors?.url)}
              aria-describedby={
                fieldErrors?.url ? 'profile-link-url-error' : 'profile-link-url-help'
              }
              placeholder={profileLinkUrlPlaceholder(form.type)}
            />
            <p id="profile-link-url-help" className="text-xs text-[var(--app-smoke)]">
              {profileLinkUrlHelp(form.type)}
            </p>
            {fieldErrors?.url ? (
              <p id="profile-link-url-error" className="text-sm text-[var(--app-error)]" role="alert">
                {fieldErrors.url}
              </p>
            ) : null}
          </div>
          {error && !fieldErrors?.url ? (
            <p className="text-sm text-[var(--app-error)]" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="cc-app-btn cc-app-btn--primary"
              disabled={createPending || updatePending}
              aria-busy={createPending || updatePending}
            >
              {createPending || updatePending ? 'Saving…' : 'Save link'}
            </button>
            <button type="button" className="cc-app-btn cc-app-btn--ghost" onClick={resetEditor}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {error && mode.kind === 'idle' ? (
        <p className="text-sm text-[var(--app-error)]" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
