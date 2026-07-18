'use client';

import { useId, useRef, useState, type FormEvent } from 'react';

const REASONS = [
  { value: 'spam', label: 'Spam or misleading content' },
  { value: 'harassment', label: 'Harassment or abuse' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'copyright', label: 'Copyright concern' },
  { value: 'other', label: 'Other policy concern' },
] as const;

const DESCRIPTION_MAX_LENGTH = 1500;

export function PublicReportDialog({
  targetType,
  targetId,
}: {
  targetType: 'profile' | 'project';
  targetId: string;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const reasonSelectRef = useRef<HTMLSelectElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reasonErrorId = useId();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: 'success' | 'error';
    message: string;
  } | null>(null);
  const [reasonInvalid, setReasonInvalid] = useState(false);

  function open() {
    setReason('');
    setDescription('');
    setFeedback(null);
    setReasonInvalid(false);
    dialogRef.current?.showModal();
  }

  function close() {
    if (pending) return;
    dialogRef.current?.close();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!reason) {
      setReasonInvalid(true);
      setFeedback({ kind: 'error', message: 'Choose a reason before submitting.' });
      reasonSelectRef.current?.focus();
      return;
    }

    setPending(true);
    setFeedback(null);
    setReasonInvalid(false);
    try {
      const response = await fetch('/api/moderation/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason_category: reason,
          ...(description.trim() ? { description: description.trim() } : {}),
        }),
      });

      if (!response.ok) {
        setFeedback({
          kind: 'error',
          message:
            response.status === 429
              ? 'Too many reports were submitted. Please try again later.'
              : response.status === 404
                ? 'This content is no longer available to report.'
                : 'Your report could not be submitted. Please try again.',
        });
        return;
      }

      setFeedback({
        kind: 'success',
        message: 'Report submitted. CodeCard will review it.',
      });
    } catch {
      setFeedback({
        kind: 'error',
        message: 'Your report could not be submitted. Please try again.',
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="cc-app-btn cc-app-btn--ghost min-h-11"
        aria-label={`Report this ${targetType}`}
        onClick={open}
      >
        Report
      </button>
      <dialog
        ref={dialogRef}
        className="m-auto w-[min(92vw,32rem)] rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-0 text-[var(--app-ink)] shadow-2xl backdrop:bg-black/60"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        onClose={() => triggerRef.current?.focus()}
      >
        <form
          className="grid gap-5 p-6"
          noValidate
          onSubmit={(event) => void submit(event)}
        >
          <div>
            <h2 id={titleId} className="text-xl font-semibold">
              Report this {targetType}
            </h2>
            <p id={descriptionId} className="mt-2 text-sm text-[var(--app-smoke)]">
              Reports are private and reviewed by CodeCard moderators. Reporting does not
              automatically hide content.
            </p>
          </div>

          {feedback?.kind === 'success' ? (
            <div className="grid gap-4">
              <p role="status" className="text-emerald-700">
                {feedback.message}
              </p>
              <button
                type="button"
                className="cc-app-btn cc-app-btn--primary min-h-11"
                onClick={close}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <label className="grid gap-2 text-sm font-semibold">
                <span>Reason</span>
                <select
                  ref={reasonSelectRef}
                  required
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setReasonInvalid(false);
                  }}
                  aria-invalid={reasonInvalid ? true : undefined}
                  aria-describedby={reasonInvalid ? reasonErrorId : undefined}
                  className="min-h-11 rounded-lg border border-[var(--app-line)] bg-transparent px-3 font-normal"
                >
                  <option value="">Choose a reason</option>
                  {REASONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                <span>Optional details</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  rows={5}
                  autoComplete="off"
                  className="w-full resize-y rounded-lg border border-[var(--app-line)] bg-transparent p-3 font-normal"
                  aria-describedby={`${descriptionId}-count`}
                />
              </label>
              <span
                id={`${descriptionId}-count`}
                className="text-xs text-[var(--app-smoke)]"
              >
                {description.length}/{DESCRIPTION_MAX_LENGTH} characters
              </span>

              {feedback && (
                <p id={reasonErrorId} role="alert" className="text-sm text-red-700">
                  {feedback.message}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="cc-app-btn cc-app-btn--ghost min-h-11"
                  disabled={pending}
                  onClick={close}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cc-app-btn cc-app-btn--primary min-h-11"
                  disabled={pending}
                  aria-busy={pending}
                >
                  {pending ? 'Submitting…' : 'Submit report'}
                </button>
              </div>
            </>
          )}
        </form>
      </dialog>
    </>
  );
}
