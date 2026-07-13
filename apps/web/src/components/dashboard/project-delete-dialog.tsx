'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProjectAction } from '@/app/actions/projects';

type ProjectDeleteDialogProps = {
  projectId: string;
  projectTitle: string;
};

export function ProjectDeleteDialog({
  projectId,
  projectTitle,
}: ProjectDeleteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleDelete() {
    if (pending) return;
    setError('');
    startTransition(async () => {
      const result = await deleteProjectAction(projectId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.redirectTo) {
        router.push(result.redirectTo);
      }
    });
  }

  return (
    <section className="mx-auto mt-8 w-full max-w-[720px] rounded-[12px] border border-red-500/20 bg-red-500/5 p-5">
      <p className="text-[13px] font-medium text-vellum">Danger zone</p>
      <p className="mt-1 text-[13px] text-lichen">
        Deleting a project cannot be undone. Your dashboard and public profile will no longer show
        it.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex h-10 items-center rounded-full border border-red-500/40 px-4 text-[13px] text-red-300 hover:border-red-400"
        >
          Delete project
        </button>
      ) : (
        <div className="mt-4 space-y-3" role="alertdialog" aria-labelledby="delete-project-title">
          <p id="delete-project-title" className="text-[13px] text-vellum">
            Delete <strong>{projectTitle}</strong>? This action cannot be undone.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              aria-busy={pending}
              onClick={handleDelete}
              className="inline-flex h-10 items-center rounded-full bg-red-600 px-4 text-[13px] text-white disabled:opacity-60"
            >
              {pending ? 'Deleting…' : 'Confirm delete'}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setError('');
              }}
              className="cc-btn-pill-ghost inline-flex h-10 items-center px-4 text-[13px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-[13px] text-red-400" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
