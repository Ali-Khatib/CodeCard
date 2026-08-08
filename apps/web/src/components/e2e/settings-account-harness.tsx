'use client';

import { useEffect, useState } from 'react';
import { AccountExportAction } from '@/components/dashboard/account-export-action';
import { AccountDeletionDialog } from '@/components/dashboard/account-deletion-dialog';
import { MutationFeedbackProvider } from '@/components/dashboard/mutation-feedback-provider';
import { MAIN_CONTENT_ID } from '@/lib/a11y/main-content';

/**
 * Browser-only harness for Settings account export/deletion controls.
 * Disabled unless CODECARD_E2E_FIXTURES=1.
 */
export function SettingsAccountHarness() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <MutationFeedbackProvider>
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="min-h-[100dvh] bg-[var(--app-canvas)] p-4 text-[var(--app-ink)] sm:p-8"
        data-e2e-ready={ready ? 'true' : 'false'}
      >
        <section className="mx-auto max-w-xl rounded-[20px] border border-[var(--app-border)] bg-[var(--app-paper)] p-5 sm:p-8">
          <h1 className="text-[24px] font-semibold">Settings account controls fixture</h1>
          <p className="mt-2 text-[14px] text-[var(--app-smoke)]">
            Exercises live account export and deletion UI against intercepted APIs.
          </p>
          <div className="mt-6 flex flex-col items-start gap-4">
            <AccountExportAction live />
            <AccountDeletionDialog
              live
              email="e2e@example.com"
              auth={{ hasPassword: true, oauthProvider: null }}
              passwordReauth={async ({ password }) => ({
                ok: password === 'CorrectHorseBattery',
              })}
            />
          </div>
        </section>
      </main>
    </MutationFeedbackProvider>
  );
}
