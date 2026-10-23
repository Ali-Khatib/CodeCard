'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  PROFILE_LINK_SELECTABLE_TYPES,
  profileLinkUrlHelp,
  profileLinkUrlPlaceholder,
} from '@codecard/validation';
import type { ProfileLinkType } from '@codecard/types';
import type { ProfileLinkMutationState, ProfileLinkRow } from '@/lib/profile/profile-link-core';
import { postOwnedForm } from '@/lib/dashboard/post-owned-form';
import { getProfileLinkAria, resolveProfileLinkIcon } from '@/lib/icons/profile-links';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';

type ProfileLinksEditorProps = {
  links: ProfileLinkRow[];
  /** Show the same link controls without writing them to an account. */
  preview?: boolean;
};

type EditorMode =
  | { kind: 'idle' }
  | { kind: 'add' }
  | { kind: 'edit'; link: ProfileLinkRow };

const emptyForm = { type: 'website', label: '', url: '' };

function withSortOrder(items: ProfileLinkRow[]) {
  return items.map((link, index) => ({ ...link, sort_order: index }));
}

export function ProfileLinksEditor({ links, preview = false }: ProfileLinksEditorProps) {
  const { notifySuccess, notifyError } = useMutationFeedback();
  const [items, setItems] = useState(links);
  const [mode, setMode] = useState<EditorMode>({ kind: 'idle' });
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ProfileLinkMutationState['fieldErrors']>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(links);
  }, [links]);

  const sortedLinks = useMemo(
    () => [...items].sort((a, b) => a.sort_order - b.sort_order),
    [items],
  );

  const typeOptions = useMemo((): ProfileLinkType[] => {
    const options: ProfileLinkType[] = [...PROFILE_LINK_SELECTABLE_TYPES];
    if (mode.kind === 'edit' && mode.link.type === 'resume') {
      options.push('resume');
    }
    return options;
  }, [mode]);

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

  function applyLinkResult(result: ProfileLinkMutationState, kind: EditorMode['kind']) {
    if (result.success && result.link) {
      setItems((current) =>
        kind === 'edit'
          ? current.map((item) => (item.id === result.link!.id ? result.link! : item))
          : [...current, result.link!],
      );
      resetEditor();
      notifySuccess(
        kind === 'edit'
          ? MUTATION_FEEDBACK.profile.linkUpdated
          : MUTATION_FEEDBACK.profile.linkAdded,
      );
      return;
    }
    if (result.error) {
      setError(result.error);
      if (!result.fieldErrors) {
        notifyError(result.error, MUTATION_FEEDBACK.profile.linkFailed);
      }
    }
    if (result.fieldErrors) setFieldErrors(result.fieldErrors);
  }

  async function submitLink(e: React.FormEvent) {
    e.preventDefault();
    if (preview) {
      setError('Create an account to edit and save this card.');
      return;
    }
    if (saving || mode.kind === 'idle') return;
    setError('');
    setFieldErrors({});

    const fd = new FormData();
    fd.set('type', form.type);
    fd.set('label', form.label);
    fd.set('url', form.url);
    const kind = mode.kind;
    const path =
      kind === 'edit' ? '/api/profile/links?op=update' : '/api/profile/links?op=create';
    if (kind === 'edit') fd.set('link_id', mode.link.id);

    setSaving(true);
    try {
      const result = await postOwnedForm<ProfileLinkMutationState>(path, fd);
      applyLinkResult(result, kind);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(link: ProfileLinkRow) {
    if (preview) {
      setError('Create an account to edit and save this card.');
      return;
    }
    if (pendingAction || saving) return;
    if (!window.confirm('Delete this profile link?')) return;
    setPendingAction(`delete:${link.id}`);
    const fd = new FormData();
    fd.set('link_id', link.id);
    try {
      const result = await postOwnedForm<ProfileLinkMutationState>(
        '/api/profile/links?op=delete',
        fd,
      );
      if (result.success) {
        setItems((current) =>
          withSortOrder(current.filter((item) => item.id !== link.id)),
        );
        notifySuccess(MUTATION_FEEDBACK.profile.linkDeleted);
      } else if (result.error) {
        setError(result.error);
        notifyError(result.error, MUTATION_FEEDBACK.profile.linkFailed);
      }
    } finally {
      setPendingAction(null);
    }
  }

  async function handleMove(link: ProfileLinkRow, direction: 'up' | 'down') {
    if (preview) {
      setError('Create an account to edit and save this card.');
      return;
    }
    if (pendingAction || saving) return;
    setPendingAction(`move:${link.id}:${direction}`);
    const fd = new FormData();
    fd.set('link_id', link.id);
    fd.set('direction', direction);
    try {
      const result = await postOwnedForm<ProfileLinkMutationState>(
        '/api/profile/links?op=move',
        fd,
      );
      if (result.success) {
        setItems((current) => {
          const ordered = [...current].sort((a, b) => a.sort_order - b.sort_order);
          const index = ordered.findIndex((item) => item.id === link.id);
          const target = direction === 'up' ? index - 1 : index + 1;
          if (index < 0 || target < 0 || target >= ordered.length) return current;
          const next = [...ordered];
          const [moved] = next.splice(index, 1);
          next.splice(target, 0, moved!);
          return withSortOrder(next);
        });
        notifySuccess(MUTATION_FEEDBACK.profile.linkOrderUpdated);
      } else if (result.error) {
        setError(result.error);
        notifyError(result.error, MUTATION_FEEDBACK.profile.linkFailed);
      }
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section
      className="space-y-3 scroll-mt-28"
      aria-label="Profile links"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-medium text-[var(--app-ink)]">Profile links</h3>
          <p className="mt-1 text-[13px] text-[var(--app-smoke)]">
            Use the site that matches the network.
          </p>
        </div>
        {mode.kind === 'idle' ? (
          <button type="button" className="cc-app-btn cc-app-btn--ghost" onClick={openAdd}>
            Add link
          </button>
        ) : null}
      </div>

      <div aria-live="polite">
        {saving || pendingAction ? (
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
                <details className="cc-link-menu" aria-busy={busy}>
                  <summary aria-label={`Actions for ${getProfileLinkAria(link.type, link.label)}`}>
                    More
                  </summary>
                  <div className="cc-link-menu__panel">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openEdit(link)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy || index === 0 || saving}
                      onClick={() => handleMove(link, 'up')}
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      disabled={busy || index === sortedLinks.length - 1 || saving}
                      onClick={() => handleMove(link, 'down')}
                    >
                      Move down
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(link)}
                    >
                      Delete
                    </button>
                  </div>
                </details>
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
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type === 'twitter' ? 'X (Twitter)' : type === 'resume' ? 'Resume (legacy)' : type}
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
              disabled={saving}
              aria-busy={saving}
            >
              {saving ? 'Saving…' : 'Save link'}
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
