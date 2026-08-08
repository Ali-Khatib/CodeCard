'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  publishResearchAction,
  unpublishResearchAction,
} from '@/app/actions/research';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';

type ResearchPublishControlsProps = {
  researchPaperId: string;
  paperSlug: string;
  isPublished: boolean;
  profileIsPublic: boolean;
  profileSlug: string | null;
};

export function ResearchPublishControls({
  researchPaperId,
  paperSlug,
  isPublished,
  profileIsPublic,
  profileSlug,
}: ResearchPublishControlsProps) {
  const router = useRouter();
  const { notifySuccess, notifyError } = useMutationFeedback();
  const [pending, startTransition] = useTransition();
  const [published, setPublished] = useState(isPublished);
  const [error, setError] = useState('');
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);

  useEffect(() => {
    setPublished(isPublished);
  }, [isPublished]);

  const publicHref =
    published && profileSlug ? `/${profileSlug}/research/${paperSlug}` : null;

  function runPublish() {
    if (pending) return;
    setError('');
    startTransition(async () => {
      const result = await publishResearchAction(researchPaperId);
      if (result.error) {
        setError(result.error);
        notifyError(result.error, MUTATION_FEEDBACK.research.publishFailed);
        return;
      }
      if (result.success && result.is_published) {
        setPublished(true);
        setShowUnpublishConfirm(false);
        notifySuccess(MUTATION_FEEDBACK.research.published);
        router.refresh();
      }
    });
  }

  function runUnpublish() {
    if (pending) return;
    setError('');
    startTransition(async () => {
      const result = await unpublishResearchAction(researchPaperId);
      if (result.error) {
        setError(result.error);
        notifyError(result.error, MUTATION_FEEDBACK.research.publishFailed);
        return;
      }
      if (result.success) {
        setPublished(false);
        setShowUnpublishConfirm(false);
        notifySuccess(MUTATION_FEEDBACK.research.unpublished);
        router.refresh();
      }
    });
  }

  return (
    <section
      className="mx-auto mt-10 w-full max-w-[720px] rounded-[12px] border border-[var(--app-border)] bg-white/60 p-5"
      data-testid="research-publish-controls"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[var(--app-ink)]">Research visibility</p>
          <p className="mt-1 text-[13px] text-[var(--app-smoke)]">
            {published
              ? 'Published — this paper can appear on your public profile when your profile is public.'
              : 'Draft — this paper stays private on your dashboard.'}
          </p>
          <p className="mt-2 text-[12px] text-[var(--app-smoke)]">
            Publishing requires a title and URL slug. PDF, figures, DOI, and related projects are
            optional.
          </p>
          {published && !profileIsPublic ? (
            <p className="mt-2 text-[12px] text-[var(--app-smoke)]">
              Your profile is still private, so visitors cannot see this paper yet.
            </p>
          ) : null}
          {publicHref ? (
            <p className="mt-2 text-[13px]">
              <Link
                href={publicHref}
                className="text-[var(--app-iris)] underline-offset-2 hover:underline"
              >
                View public page
              </Link>
            </p>
          ) : null}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[12px] font-medium ${
            published
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-[var(--app-border)] text-[var(--app-smoke)]'
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
                className="cc-app-btn cc-app-btn--ghost inline-flex h-10 items-center px-4 text-[13px] disabled:opacity-60"
              >
                Unpublish research
              </button>
            ) : (
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="unpublish-research-title"
                className="flex w-full flex-wrap gap-2"
              >
                <p id="unpublish-research-title" className="w-full text-[13px] text-[var(--app-smoke)]">
                  Unpublishing removes this paper from your public profile. The paper remains
                  editable on your dashboard — this is not deletion.
                </p>
                <button
                  type="button"
                  data-confirm-cancel
                  disabled={pending}
                  onClick={() => setShowUnpublishConfirm(false)}
                  className="cc-app-btn cc-app-btn--ghost inline-flex h-10 items-center px-4 text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={pending}
                  aria-busy={pending}
                  onClick={runUnpublish}
                  className="cc-app-btn cc-app-btn--primary inline-flex h-10 items-center px-4 text-[13px] disabled:opacity-60"
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
            className="cc-app-btn cc-app-btn--primary inline-flex h-10 items-center px-4 text-[13px] disabled:opacity-60"
          >
            {pending ? 'Publishing…' : 'Publish research'}
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-3 text-[13px] text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
