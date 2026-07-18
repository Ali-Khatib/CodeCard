'use client';

import { useEffect, useMemo, useState, useTransition, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { PROJECT_LINK_TYPES } from '@codecard/validation';
import type { ProjectLinkRow } from '@/lib/projects/project-link-core';
import {
  createProjectLinkAction,
  deleteProjectLinkAction,
  updateProjectLinkAction,
  type ProjectLinkMutationState,
} from '@/lib/projects/project-link-actions';
import { getProjectLinkAria, resolveProjectLinkIcon } from '@/lib/icons/project-links';

type ProjectLinksEditorProps = {
  projectId: string;
  links: ProjectLinkRow[];
};

type EditorMode =
  | { kind: 'idle' }
  | { kind: 'add' }
  | { kind: 'edit'; link: ProjectLinkRow };

const emptyForm = { type: 'repo', label: '', url: '' };

export function ProjectLinksEditor({ projectId, links }: ProjectLinksEditorProps) {
  const router = useRouter();
  const [mode, setMode] = useState<EditorMode>({ kind: 'idle' });
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ProjectLinkMutationState['fieldErrors']>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [createState, createAction, createPending] = useActionState(createProjectLinkAction, {});
  const [updateState, updateAction, updatePending] = useActionState(updateProjectLinkAction, {});
  const [, startTransition] = useTransition();

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

  function openEdit(link: ProjectLinkRow) {
    setMode({ kind: 'edit', link });
    setForm({
      type: link.type,
      label: link.label ?? '',
      url: link.url,
    });
    setError('');
    setFieldErrors({});
  }

  useEffect(() => {
    const state = mode.kind === 'edit' ? updateState : createState;
    if (!state.success && !state.error && !state.fieldErrors) return;
    if (state.success) {
      resetEditor();
      setActionSuccess(mode.kind === 'edit' ? 'Link updated.' : 'Link added.');
      router.refresh();
      window.setTimeout(() => setActionSuccess(''), 3000);
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
    fd.set('project_id', projectId);
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

  function handleDelete(link: ProjectLinkRow) {
    if (pendingAction) return;
    if (!window.confirm('Delete this project link?')) return;
    setPendingAction(`delete:${link.id}`);
    startTransition(async () => {
      const result = await deleteProjectLinkAction({ projectId, linkId: link.id });
      if (result.error) setError(result.error);
      else {
        setActionSuccess('Link deleted.');
        router.refresh();
        window.setTimeout(() => setActionSuccess(''), 3000);
      }
      setPendingAction(null);
    });
  }

  return (
    <section
      className="mt-10 space-y-4 rounded-[16px] border border-charcoal/80 bg-charcoal/30 p-6"
      aria-label="Project links"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-medium text-vellum">Project links</h2>
          <p className="mt-1 text-[14px] text-lichen">
            Add GitHub, live demo, paper, or website links for this project.
          </p>
        </div>
        {mode.kind === 'idle' && (
          <button type="button" className="cc-btn-pill-primary h-9 px-4 text-[13px]" onClick={openAdd}>
            Add link
          </button>
        )}
      </div>

      {sortedLinks.length === 0 && mode.kind === 'idle' ? (
        <p className="text-[14px] text-lichen">
          No links yet. Add a repository, live demo, or documentation link visitors can open.
        </p>
      ) : (
        <ul className="space-y-3">
          {sortedLinks.map((link) => {
            const Icon = resolveProjectLinkIcon(link.type);
            const busy = pendingAction === `delete:${link.id}`;
            return (
              <li
                key={link.id}
                className="flex flex-col gap-3 rounded-[12px] border border-charcoal/80 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-charcoal/80">
                    <Icon className="text-sm text-vellum" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-vellum">
                      {getProjectLinkAria(link.type, link.label)}
                    </p>
                    <p className="truncate text-[12px] text-graphite">{link.url}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="cc-btn-pill-ghost h-8 px-3 text-[12px]"
                    disabled={busy}
                    onClick={() => openEdit(link)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="cc-btn-pill-ghost h-8 px-3 text-[12px] text-red-300"
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

      {mode.kind !== 'idle' && (
        <form onSubmit={submitLink} className="space-y-4 border-t border-charcoal/80 pt-4">
          <h3 className="text-[15px] font-medium text-vellum">
            {mode.kind === 'edit' ? 'Edit link' : 'Add link'}
          </h3>
          <label className="block space-y-2">
            <span className="text-[12px] uppercase tracking-[0.08em] text-graphite">Type</span>
            <select
              className="cc-app-input w-full"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {PROJECT_LINK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-[12px] uppercase tracking-[0.08em] text-graphite">Label (optional)</span>
            <input
              id="project-link-label"
              className="cc-app-input w-full"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              aria-invalid={Boolean(fieldErrors?.label)}
              aria-describedby={fieldErrors?.label ? 'project-link-label-error' : undefined}
            />
            {fieldErrors?.label && (
              <p id="project-link-label-error" className="text-[13px] text-red-400" role="alert">
                {fieldErrors.label}
              </p>
            )}
          </label>
          <label className="block space-y-2">
            <span className="text-[12px] uppercase tracking-[0.08em] text-graphite">URL</span>
            <input
              id="project-link-url"
              className="cc-app-input w-full"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              aria-invalid={Boolean(fieldErrors?.url)}
              aria-describedby={fieldErrors?.url ? 'project-link-url-error' : undefined}
              placeholder="https://example.com"
            />
            {fieldErrors?.url && (
              <p id="project-link-url-error" className="text-[13px] text-red-400" role="alert">
                {fieldErrors.url}
              </p>
            )}
          </label>
          {error && !fieldErrors?.url && (
            <p className="text-[13px] text-red-400" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="cc-btn-pill-primary h-9 px-4 text-[13px]"
              disabled={createPending || updatePending}
              aria-busy={createPending || updatePending}
            >
              {createPending || updatePending ? 'Saving…' : 'Save link'}
            </button>
            <button type="button" className="cc-btn-pill-ghost h-9 px-4 text-[13px]" onClick={resetEditor}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {actionSuccess && mode.kind === 'idle' && (
        <p className="text-[13px] text-emerald-300" role="status" aria-live="polite">
          {actionSuccess}
        </p>
      )}

      {error && mode.kind === 'idle' && (
        <p className="text-[13px] text-red-400" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
