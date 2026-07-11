'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@codecard/ui';
import {
  publishProfileAction,
  unpublishProfileAction,
} from '@/lib/profile/publish-profile-action';

type ProfilePublishControlsProps = {
  isPublic: boolean;
};

export function ProfilePublishControls({ isPublic }: ProfilePublishControlsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);

  function runPublish() {
    if (pending) return;
    setError('');
    startTransition(async () => {
      const result = await publishProfileAction();
      if (result.error) {
        setError(result.error);
        return;
      }
      setShowUnpublishConfirm(false);
      router.refresh();
    });
  }

  function runUnpublish() {
    if (pending) return;
    setError('');
    startTransition(async () => {
      const result = await unpublishProfileAction();
      if (result.error) {
        setError(result.error);
        return;
      }
      setShowUnpublishConfirm(false);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-zinc-700/80 bg-zinc-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-100">Profile visibility</p>
          <p className="mt-1 text-sm text-zinc-400">
            {isPublic
              ? 'Published — your profile is publicly accessible at your CodeCard URL.'
              : 'Unpublished — only you can preview your saved profile.'}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isPublic ? 'bg-emerald-500/15 text-emerald-300' : 'bg-zinc-700 text-zinc-300'
          }`}
        >
          {isPublic ? 'Published' : 'Unpublished'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {isPublic ? (
          <>
            {!showUnpublishConfirm ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setShowUnpublishConfirm(true)}
              >
                Unpublish profile
              </Button>
            ) : (
              <>
                <p className="w-full text-sm text-amber-300/90" role="status">
                  Unpublishing will remove public access to your profile URL. Visitors will see a
                  not-found page instead of your card.
                </p>
                <Button type="button" disabled={pending} onClick={runUnpublish}>
                  {pending ? 'Unpublishing…' : 'Confirm unpublish'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setShowUnpublishConfirm(false)}
                >
                  Cancel
                </Button>
              </>
            )}
          </>
        ) : (
          <Button type="button" disabled={pending} onClick={runPublish}>
            {pending ? 'Publishing…' : 'Publish profile'}
          </Button>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
