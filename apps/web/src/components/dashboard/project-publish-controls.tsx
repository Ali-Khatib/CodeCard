'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  publishProjectAction,
  unpublishProjectAction,
} from '@/app/actions/projects';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';

type ProjectPublishControlsProps = {
  projectId: string;
  isPublished: boolean;
  profileIsPublic: boolean;
};

export function ProjectPublishControls({
  projectId,
  isPublished,
  profileIsPublic,
}: ProjectPublishControlsProps) {
  const router = useRouter();
  const { notifySuccess, notifyError } = useMutationFeedback();
  const [pending, startTransition] = useTransition();
  const [published, setPublished] = useState(isPublished);
  const [error, setError] = useState('');
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);

  function runPublish() {
    if (pending) return;
    setError('');
    startTransition(async () => {
      const result = await publishProjectAction(projectId);
      if (result.error) {
        setError(result.error);
        notifyError(result.error, MUTATION_FEEDBACK.project.publishFailed);
        return;
      }
      setPublished(true);
      setShowUnpublishConfirm(false);
      notifySuccess(MUTATION_FEEDBACK.project.published);
      router.refresh();
    });
  }

  function runUnpublish() {
    if (pending) return;
    setError('');
    startTransition(async () => {
      const result = await unpublishProjectAction(projectId);
      if (result.error) {
        setError(result.error);
        notifyError(result.error, MUTATION_FEEDBACK.project.publishFailed);
        return;
      }
      setPublished(false);
      setShowUnpublishConfirm(false);
      notifySuccess(MUTATION_FEEDBACK.project.unpublished);
      router.refresh();
    });
  }

  return (
    <section className="mx-auto mt-10 w-full max-w-[720px] rounded-[12px] border border-charcoal/70 bg-charcoal/30 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-vellum">Project visibility</p>
          <p className="mt-1 text-[13px] text-lichen">
            {published
              ? 'Published — this project can appear on your public profile when your profile is public.'
              : 'Unpublished — this project stays private on your dashboard.'}
          </p>
          {published && !profileIsPublic && (
            <p className="mt-2 text-[12px] text-ash">
              Your profile is still private, so visitors cannot see this project yet.
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[12px] font-medium ${
            published ? 'bg-reactor/15 text-reactorBright' : 'bg-charcoal text-lichen'
          }`}
        >
          {published ? 'Published' : 'Draft'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {published ? (
          <>
            {!showUnpublishConfirm ? (
              <button
                type="button"
                disabled={pending}
                aria-busy={pending}
                onClick={() => setShowUnpublishConfirm(true)}
                className="cc-btn-pill-ghost inline-flex h-10 items-center px-4 text-[13px] disabled:opacity-60"
              >
                Unpublish project
              </button>
            ) : (
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="unpublish-project-title"
                className="flex w-full flex-wrap gap-2"
              >
                <p id="unpublish-project-title" className="w-full text-[13px] text-ash">
                  Unpublishing removes this project from your public profile and project navigation.
                  The project remains editable on your dashboard — this is not deletion.
                </p>
                <button
                  type="button"
                  data-confirm-cancel
                  disabled={pending}
                  onClick={() => setShowUnpublishConfirm(false)}
                  className="cc-btn-pill-ghost inline-flex h-10 items-center px-4 text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={pending}
                  aria-busy={pending}
                  onClick={runUnpublish}
                  className="cc-btn-pill-primary inline-flex h-10 items-center px-4 text-[13px] disabled:opacity-60"
                >
                  Confirm unpublish
                </button>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            disabled={pending}
            aria-busy={pending}
            onClick={runPublish}
            className="cc-btn-pill-primary inline-flex h-10 items-center px-4 text-[13px] disabled:opacity-60"
          >
            Publish project
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 text-[13px] text-red-400" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
