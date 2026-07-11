'use client';

import { useEffect, useMemo, useState, useTransition, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label } from '@codecard/ui';
import { PROFILE_LINK_TYPES } from '@codecard/validation';
import type { ProfileLinkRow } from '@/lib/profile/profile-link-core';
import {
  createProfileLinkAction,
  deleteProfileLinkAction,
  moveProfileLinkAction,
  updateProfileLinkAction,
  type ProfileLinkMutationState,
} from '@/lib/profile/profile-link-actions';
import { getProfileLinkAria, resolveProfileLinkIcon } from '@/lib/icons/profile-links';

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
      router.refresh();
      return;
    }
    if (state.error) setError(state.error);
    if (state.fieldErrors) setFieldErrors(state.fieldErrors);
  }, [createState, updateState, mode.kind, router]);

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
      updateAction(fd);
      return;
    }
    createAction(fd);
  }

  function handleDelete(link: ProfileLinkRow) {
    if (pendingAction) return;
    if (!window.confirm('Delete this profile link?')) return;
    setPendingAction(`delete:${link.id}`);
    startTransition(async () => {
      const result = await deleteProfileLinkAction(link.id);
      if (result.error) setError(result.error);
      else router.refresh();
      setPendingAction(null);
    });
  }

  function handleMove(link: ProfileLinkRow, direction: 'up' | 'down') {
    if (pendingAction) return;
    setPendingAction(`move:${link.id}:${direction}`);
    startTransition(async () => {
      const result = await moveProfileLinkAction(link.id, direction);
      if (result.error) setError(result.error);
      else router.refresh();
      setPendingAction(null);
    });
  }

  return (
    <section className="space-y-4 rounded-lg border border-zinc-700/80 bg-zinc-900/40 p-4" aria-label="Profile links">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-100">Profile links</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Add social and contact links visitors can open from your card.
          </p>
        </div>
        {mode.kind === 'idle' && (
          <Button type="button" variant="outline" onClick={openAdd}>
            Add link
          </Button>
        )}
      </div>

      {sortedLinks.length === 0 && mode.kind === 'idle' ? (
        <p className="text-sm text-zinc-400">
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
                className="flex flex-col gap-3 rounded-lg border border-zinc-700/60 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800">
                    <Icon className="text-sm" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {getProfileLinkAria(link.type, link.label)}
                    </p>
                    <p className="truncate text-xs text-zinc-400">{link.url}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || index === 0 || isPending}
                    onClick={() => handleMove(link, 'up')}
                    aria-label={`Move ${getProfileLinkAria(link.type, link.label)} up`}
                  >
                    Up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || index === sortedLinks.length - 1 || isPending}
                    onClick={() => handleMove(link, 'down')}
                    aria-label={`Move ${getProfileLinkAria(link.type, link.label)} down`}
                  >
                    Down
                  </Button>
                  <Button type="button" variant="outline" disabled={busy} onClick={() => openEdit(link)}>
                    Edit
                  </Button>
                  <Button type="button" variant="destructive" disabled={busy} onClick={() => handleDelete(link)}>
                    Delete
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {mode.kind !== 'idle' && (
        <form onSubmit={submitLink} className="space-y-4 border-t border-zinc-700/60 pt-4">
          <h4 className="text-sm font-medium text-zinc-100">
            {mode.kind === 'edit' ? 'Edit link' : 'Add link'}
          </h4>
          <div className="space-y-2">
            <Label htmlFor="profile-link-type">Type</Label>
            <select
              id="profile-link-type"
              className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {PROFILE_LINK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-link-label">Label (optional)</Label>
            <Input
              id="profile-link-label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              aria-invalid={Boolean(fieldErrors?.label)}
            />
            {fieldErrors?.label && (
              <p className="text-sm text-red-400" role="alert">
                {fieldErrors.label}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-link-url">{form.type === 'email' ? 'Email' : 'URL'}</Label>
            <Input
              id="profile-link-url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              aria-invalid={Boolean(fieldErrors?.url)}
              placeholder={form.type === 'email' ? 'you@example.com' : 'https://example.com'}
            />
            {fieldErrors?.url && (
              <p className="text-sm text-red-400" role="alert">
                {fieldErrors.url}
              </p>
            )}
          </div>
          {error && !fieldErrors?.url && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={createPending || updatePending} aria-busy={createPending || updatePending}>
              {createPending || updatePending ? 'Saving…' : 'Save link'}
            </Button>
            <Button type="button" variant="outline" onClick={resetEditor}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {error && mode.kind === 'idle' && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
