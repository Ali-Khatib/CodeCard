'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MODERATION_NOTE_MAX_LENGTH = 4000;

export function ModerationNoteEditor({
  reportId,
  initialNote,
  initialUpdatedAt,
}: {
  reportId: string;
  initialNote: string | null;
  initialUpdatedAt: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote ?? '');
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: 'success' | 'error';
    message: string;
  } | null>(null);

  async function save() {
    if (pending) return;
    setPending(true);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/admin/reports/${encodeURIComponent(reportId)}/note`,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            note: note.trim() || null,
            expectedUpdatedAt: updatedAt,
          }),
        },
      );

      if (!response.ok) {
        setFeedback({
          kind: 'error',
          message:
            response.status === 409
              ? 'This note changed elsewhere. Refresh before saving again.'
              : response.status === 422
                ? `Internal notes must be ${MODERATION_NOTE_MAX_LENGTH} characters or fewer.`
                : 'The internal note could not be saved. Please try again.',
        });
        return;
      }

      const result = (await response.json()) as { updatedAt?: unknown };
      if (typeof result.updatedAt === 'string') setUpdatedAt(result.updatedAt);
      setFeedback({
        kind: 'success',
        message: note.trim() ? 'Internal note saved.' : 'Internal note cleared.',
      });
      router.refresh();
    } catch {
      setFeedback({
        kind: 'error',
        message: 'The internal note could not be saved. Please try again.',
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-[var(--app-line)] p-4">
      <label className="grid gap-2 text-sm font-semibold">
        <span>Private internal moderation note</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={MODERATION_NOTE_MAX_LENGTH}
          rows={4}
          autoComplete="off"
          className="w-full resize-y rounded-lg border border-[var(--app-line)] bg-transparent p-3 font-normal"
          aria-describedby={`moderation-note-count-${reportId}`}
        />
      </label>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <span
          id={`moderation-note-count-${reportId}`}
          className="text-xs text-[var(--app-smoke)]"
        >
          {note.length}/{MODERATION_NOTE_MAX_LENGTH} characters
        </span>
        <button
          type="button"
          className="cc-app-btn cc-app-btn--ghost min-h-11"
          disabled={pending}
          aria-busy={pending}
          onClick={() => void save()}
        >
          {pending ? 'Saving…' : 'Save internal note'}
        </button>
      </div>
      {feedback && (
        <p
          className={`mt-3 text-sm ${
            feedback.kind === 'error' ? 'text-red-700' : 'text-emerald-700'
          }`}
          role={feedback.kind === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
