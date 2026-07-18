'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ModerationReportAction } from '@/lib/admin/moderation-actions';

type Feedback = { kind: 'success' | 'error'; message: string } | null;

export function ReportActions({
  reportId,
  targetLabel,
}: {
  reportId: string;
  targetLabel: string;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<ModerationReportAction | null>(null);
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
