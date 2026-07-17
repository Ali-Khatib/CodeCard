'use client';

import { useEffect, useState, useTransition } from 'react';
import { updateConnectionMetadataAction } from '@/app/actions/connection-metadata';
import { AppButton } from '@/components/dashboard/ui/dashboard-ui';

type ConnectionPrivateDetailsProps = {
  connectionId: string;
  connectionName: string;
  initialNote: string | null;
  initialContext: string | null;
  initialConnectedAt: string | null;
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
  open,
  onClose,
  onSaved,
}: ConnectionPrivateDetailsProps) {
  const [note, setNote] = useState(initialNote ?? '');
  const [context, setContext] = useState(initialContext ?? '');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setNote(initialNote ?? '');
      setContext(initialContext ?? '');
      setError(null);
      setStatus(null);
    }
  }, [open, initialNote, initialContext, connectionId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const dirty =
    note !== (initialNote ?? '') || context !== (initialContext ?? '');

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

  const attemptClose = () => {
    if (dirty && !window.confirm('Discard unsaved private details?')) return;
    onClose();
  };

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
              How you know them
            </label>
            <input
              id={`context-${connectionId}`}
              className="cc-app-input"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              maxLength={500}
              placeholder="Conference, intro, collaborator…"
            />
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
          <AppButton variant="ghost" onClick={attemptClose}>
            Cancel
          </AppButton>
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
