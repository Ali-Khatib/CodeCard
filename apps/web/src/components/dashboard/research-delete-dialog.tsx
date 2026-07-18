'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { deleteResearchAction } from '@/app/actions/research';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';
import { useConfirmPanelA11y } from '@/lib/a11y/use-confirm-panel-a11y';

type ResearchDeleteDialogProps = {
  researchPaperId: string;
  paperTitle: string;
};

export function ResearchDeleteDialog({
  researchPaperId,
  paperTitle,
}: ResearchDeleteDialogProps) {
  const router = useRouter();
  const { notifySuccess, notifyError } = useMutationFeedback();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const onClose = useCallback(() => {
    setOpen(false);
    setError('');
  }, []);

  const { panelRef, triggerRef, cancelRef, closePanel } = useConfirmPanelA11y({
    open,
    locked: pending,
    initialFocus: 'cancel',
    onClose,
  });

  function handleDelete() {
    if (pending) return;
    setError('');
    startTransition(async () => {
      const result = await deleteResearchAction(researchPaperId);
      if (result.error) {
        setError(result.error);
        notifyError(result.error, MUTATION_FEEDBACK.research.deleteFailed);
        return;
      }
      notifySuccess(MUTATION_FEEDBACK.research.deleted);
      if (result.redirectTo) {
        router.push(result.redirectTo);
      }
    });
  }

  return (
    <section className="mx-auto mt-8 w-full max-w-[720px] rounded-[12px] border border-red-500/20 bg-red-500/5 p-5">
      <p className="text-[13px] font-medium text-[var(--app-ink)]">Danger zone</p>
      <p className="mt-1 text-[13px] text-[var(--app-smoke)]">
        Deleting a research paper cannot be undone. Your dashboard and public profile will no longer
        show it. Related projects are not deleted.
      </p>

      {!open ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Delete research paper ${paperTitle}`}
          className="mt-4 inline-flex h-10 items-center rounded-full border border-red-500/40 px-4 text-[13px] text-red-700 hover:border-red-400"
        >
          Delete research paper
        </button>
      ) : (
        <div
          ref={panelRef}
          className="mt-4 space-y-3"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-research-title"
          aria-describedby="delete-research-desc"
        >
          <p id="delete-research-title" className="text-[13px] text-[var(--app-ink)]">
            Delete <strong>{paperTitle}</strong>?
          </p>
          <p id="delete-research-desc" className="text-[13px] text-[var(--app-smoke)]">
            This action cannot be undone. The paper will be removed from your dashboard and public
            profile. Related projects are not deleted.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              ref={cancelRef}
              type="button"
              data-confirm-cancel
              disabled={pending}
              onClick={closePanel}
              className="cc-app-btn cc-app-btn--ghost inline-flex h-10 items-center px-4 text-[13px]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              aria-busy={pending}
              aria-label={`Confirm delete research paper ${paperTitle}`}
              onClick={handleDelete}
              className="inline-flex h-10 items-center rounded-full bg-red-600 px-4 text-[13px] text-white disabled:opacity-60"
            >
              {pending ? 'Deleting…' : 'Confirm delete'}
            </button>
          </div>
        </div>
      )}

      {error ? (
        <p className="mt-3 text-[13px] text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
