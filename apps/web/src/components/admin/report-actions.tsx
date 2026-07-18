'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ModerationReportAction } from '@/lib/admin/moderation-actions';
import type { AdminHideTargetType } from '@/lib/admin/content-hiding';

type Feedback = { kind: 'success' | 'error'; message: string } | null;
type PendingAction = ModerationReportAction | 'hide' | 'suspend';

export function ReportActions({
  reportId,
  targetLabel,
  targetType,
  targetId,
  ownerUserId,
}: {
  reportId: string;
  targetLabel: string;
  targetType: string;
  targetId: string;
  ownerUserId: string | null;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function run(action: ModerationReportAction) {
    if (pendingAction) return;
    const verb = action === 'resolve' ? 'resolve' : 'dismiss';
    if (
      !window.confirm(
        `Confirm ${verb} for this ${targetLabel} report. This changes only the report workflow status.`,
      )
    ) {
      return;
    }

    setPendingAction(action);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/reports/${encodeURIComponent(reportId)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        setFeedback({
          kind: 'error',
          message:
            response.status === 409
              ? 'This report was already completed differently. Refresh and review its status.'
              : 'The report could not be updated. Please try again.',
        });
        return;
      }

      setFeedback({
        kind: 'success',
        message: action === 'resolve' ? 'Report resolved.' : 'Report dismissed.',
      });
      router.refresh();
    } catch {
      setFeedback({ kind: 'error', message: 'The report could not be updated. Please try again.' });
    } finally {
      setPendingAction(null);
    }
  }

  async function hideContent() {
    if (pendingAction || (targetType !== 'profile' && targetType !== 'project')) return;
    if (
      !window.confirm(
        `Hide this ${targetLabel} from public view? The owner's record will be preserved, but a moderation hold will prevent republishing.`,
      )
    ) {
      return;
    }

    setPendingAction('hide');
    setFeedback(null);
    try {
      const response = await fetch('/api/admin/content/hide', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          reportId,
          targetType: targetType as AdminHideTargetType,
          targetId,
        }),
      });

      if (!response.ok) {
        setFeedback({
          kind: 'error',
          message:
            response.status === 409
              ? 'This report no longer matches an eligible pending action. Refresh and review it.'
              : 'The content could not be hidden. Please try again.',
        });
        return;
      }

      setFeedback({ kind: 'success', message: 'Content hidden without deleting the owner record.' });
      router.refresh();
    } catch {
      setFeedback({ kind: 'error', message: 'The content could not be hidden. Please try again.' });
    } finally {
      setPendingAction(null);
    }
  }

  async function suspendAccount() {
    if (pendingAction || !ownerUserId) return;
    if (
      !window.confirm(
        `Suspend account ${ownerUserId.slice(0, 8)}… ? This removes public visibility and bans sign-in. It does not delete the account or cancel billing.`,
      )
    ) {
      return;
    }

    setPendingAction('suspend');
    setFeedback(null);
    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(ownerUserId)}/suspend`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ reportId }),
        },
      );

      if (!response.ok) {
        setFeedback({
          kind: 'error',
          message:
            response.status === 503
              ? 'Suspension is incomplete and can be retried safely.'
              : response.status === 409
                ? 'This account cannot be suspended. Refresh and review the target.'
                : 'The account could not be suspended. Please try again.',
        });
        return;
      }

      setFeedback({
        kind: 'success',
        message: 'Account suspended. Records were preserved for moderation.',
      });
      router.refresh();
    } catch {
      setFeedback({
        kind: 'error',
        message: 'The account could not be suspended. Please try again.',
      });
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="cc-app-btn cc-app-btn--primary min-h-11"
          disabled={pendingAction !== null}
          aria-busy={pendingAction === 'resolve'}
          onClick={() => void run('resolve')}
        >
          {pendingAction === 'resolve' ? 'Resolving…' : 'Resolve report'}
        </button>
        <button
          type="button"
          className="cc-app-btn cc-app-btn--ghost min-h-11"
          disabled={pendingAction !== null}
          aria-busy={pendingAction === 'dismiss'}
          onClick={() => void run('dismiss')}
        >
          {pendingAction === 'dismiss' ? 'Dismissing…' : 'Dismiss report'}
        </button>
        {(targetType === 'profile' || targetType === 'project') && (
          <button
            type="button"
            className="cc-app-btn cc-app-btn--ghost min-h-11 border-red-600/40 text-red-700"
            disabled={pendingAction !== null}
            aria-busy={pendingAction === 'hide'}
            onClick={() => void hideContent()}
          >
            {pendingAction === 'hide' ? 'Hiding…' : 'Hide public content'}
          </button>
        )}
        {ownerUserId && (
          <button
            type="button"
            className="cc-app-btn cc-app-btn--ghost min-h-11 border-red-600/40 text-red-700"
            disabled={pendingAction !== null}
            aria-busy={pendingAction === 'suspend'}
            onClick={() => void suspendAccount()}
          >
            {pendingAction === 'suspend' ? 'Suspending…' : 'Suspend account'}
          </button>
        )}
      </div>
      {feedback && (
        <p
          className={`mt-3 text-sm ${feedback.kind === 'error' ? 'text-red-700' : 'text-emerald-700'}`}
          role={feedback.kind === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
