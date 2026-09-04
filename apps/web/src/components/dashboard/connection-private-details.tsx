'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { updateConnectionMetadataAction } from '@/app/actions/connection-metadata';
import { AppButton } from '@/components/dashboard/ui/dashboard-ui';
import { useConfirmPanelA11y } from '@/lib/a11y/use-confirm-panel-a11y';

type ConnectionPrivateDetailsProps = {
  connectionId: string;
  connectionName: string;
  initialNote: string | null;
  initialContext: string | null;
  initialConnectedAt: string | null;
  /** Existing meeting-point names for pick-or-create. */
  meetingPointSuggestions?: string[];
  open: boolean;
  onClose: () => void;
  onSaved?: (next: { privateNote: string | null; context: string | null }) => void;
};

export function ConnectionPrivateDetails({
  connectionId,
  connectionName,
  initialNote,
  initialContext,
  initialConnectedAt,
  meetingPointSuggestions = [],
  open,
  onClose,
  onSaved,
}: ConnectionPrivateDetailsProps) {
  const [note, setNote] = useState(initialNote ?? '');
  const [context, setContext] = useState(initialContext ?? '');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dirtyRef = useRef(false);
  dirtyRef.current =
    note !== (initialNote ?? '') || context !== (initialContext ?? '');

  const requestClose = useCallback(() => {
    if (dirtyRef.current && !window.confirm('Discard unsaved private details?')) {
      return;
    }
    onClose();
  }, [onClose]);

  const { panelRef, cancelRef } = useConfirmPanelA11y({
    open,
    locked: pending,
    initialFocus: 'first',
    onClose: requestClose,
  });

  useEffect(() => {
    if (open) {
      setNote(initialNote ?? '');
      setContext(initialContext ?? '');
      setError(null);
      setStatus(null);
    }
  }, [open, initialNote, initialContext, connectionId]);

  if (!open) return null;

  const save = (opts?: { clearNote?: boolean }) => {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const result = await updateConnectionMetadataAction({
        connectionId,
        privateNote: opts?.clearNote ? null : note === '' ? null : note,
        context: context === '' ? null : context,
      });
      if (!result.success || !result.metadata) {
        setError(result.error ?? 'Could not save private details.');
        return;
      }
      setNote(result.metadata.privateNote ?? '');
      setContext(result.metadata.context ?? '');
      setStatus('Private details saved.');
      onSaved?.({
        privateNote: result.metadata.privateNote,
        context: result.metadata.context,
      });
    });
  };

  const attemptClose = requestClose;

  const connectedLabel = initialConnectedAt
    ? new Date(initialConnectedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) attemptClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`private-details-${connectionId}`}
        aria-describedby={`private-details-desc-${connectionId}`}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[20px] border border-[var(--app-border)] bg-[var(--app-paper)] p-5 shadow-lg sm:rounded-[20px] sm:p-6"
      >
        <h2
          id={`private-details-${connectionId}`}
          className="text-[20px] font-medium tracking-[-0.02em] text-[var(--app-ink)]"
        >
          Private details · {connectionName}
        </h2>
        <p
          id={`private-details-desc-${connectionId}`}
          className="mt-2 text-[14px] leading-relaxed text-[var(--app-smoke)]"
        >
          Only you can see this information.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label
              htmlFor={`context-${connectionId}`}
              className="mb-1 block text-[13px] text-[var(--app-smoke)]"
            >
              Meeting point
            </label>
            <input
              id={`context-${connectionId}`}
              className="cc-app-input"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              maxLength={500}
              list={`meeting-points-${connectionId}`}
              placeholder="DevConf SF, meetup, café…"
              autoComplete="off"
            />
            {meetingPointSuggestions.length > 0 ? (
              <datalist id={`meeting-points-${connectionId}`}>
                {meetingPointSuggestions.map((point) => (
                  <option key={point} value={point} />
                ))}
              </datalist>
            ) : null}
            <p className="mt-1.5 text-[12px] text-[var(--app-smoke)]">
              Pick an existing place or type a new event / location name.
            </p>
          </div>

          <div>
            <p className="mb-1 text-[13px] text-[var(--app-smoke)]">Connected on</p>
            <p className="text-[15px] text-[var(--app-ink)]">{connectedLabel}</p>
          </div>

          <div>
            <label
              htmlFor={`note-${connectionId}`}
              className="mb-1 block text-[13px] text-[var(--app-smoke)]"
            >
              Private note
            </label>
            <textarea
              id={`note-${connectionId}`}
              className="cc-app-input min-h-[140px] resize-y"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={5000}
              placeholder="Add a private note about where you met or what you want to follow up on."
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <AppButton variant="primary" onClick={() => save()} ariaLabel="Save private details">
            {pending ? 'Saving…' : 'Save'}
          </AppButton>
          <AppButton
            variant="ghost"
            onClick={() => save({ clearNote: true })}
            ariaLabel="Clear private note"
          >
            Clear note
          </AppButton>
          <button
            ref={cancelRef}
            type="button"
            data-confirm-cancel
            className="cc-app-btn cc-app-btn--ghost"
            onClick={attemptClose}
          >
            Cancel
          </button>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {pending ? 'Saving private details' : status ?? ''}
        </p>
        {status && !pending ? (
          <p className="mt-3 text-[13px] text-[var(--app-smoke)]">{status}</p>
        ) : null}
        {error ? (
          <p className="mt-3 text-[13px] text-[var(--app-danger,#b42318)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
