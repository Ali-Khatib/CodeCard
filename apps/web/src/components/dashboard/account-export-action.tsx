'use client';

import { useCallback, useRef, useState } from 'react';
import { AsyncActionButton } from '@/components/ui/async-action-button';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { downloadAccountExport } from '@/lib/account/account-export-client';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';

type AccountExportActionProps = {
  /** When false, keeps a non-destructive demo stub (preview Settings). */
  live: boolean;
};

export function AccountExportAction({ live }: AccountExportActionProps) {
  const { notifySuccess, notifyError } = useMutationFeedback();
  const inFlightRef = useRef(false);
  const [statusText, setStatusText] = useState('');

  const demoExport = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 420));
    setStatusText('Demo export only — no account data was downloaded.');
    notifySuccess(MUTATION_FEEDBACK.account.exportDemo);
  }, [notifySuccess]);

  const liveExport = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setStatusText('Preparing your account export…');
    try {
      const result = await downloadAccountExport();
      if (!result.ok) {
        setStatusText(result.message);
        notifyError(result.message, MUTATION_FEEDBACK.account.exportFailed);
        return;
      }
      setStatusText(`Download started (${result.filename}).`);
      notifySuccess(MUTATION_FEEDBACK.account.exportReady);
    } finally {
      inFlightRef.current = false;
    }
  }, [notifyError, notifySuccess]);

  return (
    <div className="flex flex-col items-end gap-1">
      <AsyncActionButton
        variant="ghost"
        successLabel="Downloaded"
        ariaLabel={live ? 'Download account data as JSON' : 'Demo export data'}
        onAction={live ? liveExport : demoExport}
      >
        Export data
      </AsyncActionButton>
      {statusText ? (
        <p className="max-w-[220px] text-right text-[12px] leading-snug text-[var(--app-smoke)]" role="status" aria-live="polite">
          {statusText}
        </p>
      ) : (
        <p className="max-w-[220px] text-right text-[12px] leading-snug text-[var(--app-smoke)]">
          JSON download of approved account data
        </p>
      )}
    </div>
  );
}
