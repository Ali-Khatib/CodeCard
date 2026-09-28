'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { updateConnectionMetadataAction } from '@/app/actions/connection-metadata';
import { AppButton } from '@/components/dashboard/ui/dashboard-ui';
import { useConfirmPanelA11y } from '@/lib/a11y/use-confirm-panel-a11y';
import { toDateInputValue } from '@/lib/schedule/datetime';

type ConnectionPrivateDetailsProps = {
  connectionId: string;
  connectionName: string;
  initialNote: string | null;
  initialContext: string | null;
  initialConnectedAt: string | null;
  initialMetAt?: string | null;
  initialFollowUpAt?: string | null;
  /** Existing meeting-point names for pick-or-create. */
  meetingPointSuggestions?: string[];
  open: boolean;
  onClose: () => void;
  onSaved?: (next: {
    privateNote: string | null;
    context: string | null;
    followUpAt: string | null;
    metAt: string | null;
  }) => void;
};

export function ConnectionPrivateDetails({
  connectionId,
  connectionName,
  initialNote,
  initialContext,
  initialConnectedAt,
  initialMetAt = null,
  initialFollowUpAt = null,
  meetingPointSuggestions = [],
  open,
  onClose,
  onSaved,
}: ConnectionPrivateDetailsProps) {
  const [note, setNote] = useState(initialNote ?? '');
  const [context, setContext] = useState(initialContext ?? '');
  const [metAt, setMetAt] = useState(toDateInputValue(initialMetAt ?? initialConnectedAt));
  const [followUpAt, setFollowUpAt] = useState(toDateInputValue(initialFollowUpAt));
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dirtyRef = useRef(false);
  dirtyRef.current =
    note !== (initialNote ?? '') ||
    context !== (initialContext ?? '') ||
    metAt !== toDateInputValue(initialMetAt ?? initialConnectedAt) ||
    followUpAt !== toDateInputValue(initialFollowUpAt);

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
      setMetAt(toDateInputValue(initialMetAt ?? initialConnectedAt));
      setFollowUpAt(toDateInputValue(initialFollowUpAt));
      setError(null);
      setStatus(null);
    }
  }, [open, initialNote, initialContext, initialMetAt, initialConnectedAt, initialFollowUpAt, connectionId]);

  if (!open) return null;

  const save = (opts?: { clearNote?: boolean; clearFollowUp?: boolean }) => {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const result = await updateConnectionMetadataAction({
        connectionId,
        privateNote: opts?.clearNote ? null : note === '' ? null : note,
        context: context === '' ? null : context,
        metAt: metAt === '' ? null : `${metAt}T12:00:00.000Z`,
        followUpAt: opts?.clearFollowUp || followUpAt === '' ? null : followUpAt,
      });
      if (!result.success || !result.metadata) {
        setError(result.error ?? 'Could not save private details.');
        return;
      }
      setNote(result.metadata.privateNote ?? '');
      setContext(result.metadata.context ?? '');
      setMetAt(toDateInputValue(result.metadata.metAt));
      setFollowUpAt(toDateInputValue(result.metadata.followUpAt));
      setStatus('Private details saved.');
      onSaved?.({
        privateNote: result.metadata.privateNote,
        context: result.metadata.context,
        followUpAt: result.metadata.followUpAt,
        metAt: result.metadata.metAt,
      });
    });
  };

  const attemptClose = requestClose;

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
            <label
              htmlFor={`met-at-${connectionId}`}
              className="mb-1 block text-[13px] text-[var(--app-smoke)]"
            >
              Met on
            </label>
            <input
              id={`met-at-${connectionId}`}
              className="cc-app-input"
              type="date"
              value={metAt}
              onChange={(e) => setMetAt(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor={`follow-up-${connectionId}`}
              className="mb-1 block text-[13px] text-[var(--app-smoke)]"
            >
              Follow up on
            </label>
            <input
              id={`follow-up-${connectionId}`}
              className="cc-app-input"
              type="date"
              value={followUpAt}
              onChange={(e) => setFollowUpAt(e.target.value)}
            />
            <p className="mt-1.5 text-[12px] text-[var(--app-smoke)]">
              Optional. Shows on Home. Clear the date, or remove it, then save.
            </p>
            {followUpAt ? (
              <div className="mt-2">
                <AppButton
                  variant="ghost"
                  onClick={() => {
                    setFollowUpAt('');
                    save({ clearFollowUp: true });
                  }}
                  ariaLabel={`Remove follow-up with ${connectionName}`}
                >
                  Remove follow-up
                </AppButton>
              </div>
            ) : null}
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
