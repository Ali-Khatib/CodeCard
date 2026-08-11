'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  publishProfileAction,
  unpublishProfileAction,
} from '@/lib/profile/publish-profile-action';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';

type ProfilePublishControlsProps = {
  isPublic: boolean;
};

export function ProfilePublishControls({ isPublic }: ProfilePublishControlsProps) {
  const router = useRouter();
  const { notifySuccess, notifyError } = useMutationFeedback();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);

  function runPublish() {
    if (pending) return;
    setError('');
    startTransition(async () => {
      const result = await publishProfileAction();
      if (result.error) {
        const message = result.error;
        setError(message);
        notifyError(message, MUTATION_FEEDBACK.profile.publishFailed);
        return;
      }
      setShowUnpublishConfirm(false);
      notifySuccess(MUTATION_FEEDBACK.profile.published);
      router.refresh();
    });
  }

  function runUnpublish() {
    if (pending) return;
    setError('');
    startTransition(async () => {
      const result = await unpublishProfileAction();
      if (result.error) {
        const message = result.error;
        setError(message);
        notifyError(message, MUTATION_FEEDBACK.profile.publishFailed);
        return;
      }
      setShowUnpublishConfirm(false);
      notifySuccess(MUTATION_FEEDBACK.profile.unpublished);
      router.refresh();
    });
  }

  return (
    <div
      id="visibility"
      className="scroll-mt-28 rounded-[16px] border border-[var(--app-border)] bg-[var(--app-paper)] p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-medium text-[var(--app-ink)]">Profile visibility</p>
          <p className="mt-1 text-[13px] text-[var(--app-smoke)]">
            {isPublic
              ? 'Published — your profile is publicly accessible at your CodeCard URL.'
              : 'Unpublished — only you can preview your saved profile.'}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isPublic
              ? 'bg-[var(--app-mint)] text-[var(--app-slate-plum)]'
              : 'bg-[var(--app-bone)] text-[var(--app-ink)]'
          }`}
        >
          {isPublic ? 'Published' : 'Unpublished'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {isPublic ? (
          <>
            {!showUnpublishConfirm ? (
              <button
                type="button"
                className="cc-app-btn cc-app-btn--ghost"
                disabled={pending}
                aria-busy={pending}
                onClick={() => setShowUnpublishConfirm(true)}
              >
                Unpublish profile
              </button>
            ) : (
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="unpublish-profile-title"
                className="flex w-full flex-wrap gap-2"
              >
                <p id="unpublish-profile-title" className="w-full text-sm text-amber-800">
                  Unpublishing will remove public access to your profile URL. Visitors will see a
                  not-found page instead of your card. Your content remains editable — this is not
                  deletion.
                </p>
                <button
                  type="button"
                  className="cc-app-btn cc-app-btn--ghost"
                  disabled={pending}
                  onClick={() => setShowUnpublishConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="cc-app-btn cc-app-btn--primary"
                  disabled={pending}
                  aria-busy={pending}
                  onClick={runUnpublish}
                >
                  {pending ? 'Unpublishing…' : 'Confirm unpublish'}
                </button>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            className="cc-app-btn cc-app-btn--primary"
            disabled={pending}
            aria-busy={pending}
            onClick={runPublish}
          >
            {pending ? 'Publishing…' : 'Publish profile'}
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-[var(--app-error)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
