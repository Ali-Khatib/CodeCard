'use client';

import { useEffect, useState } from 'react';
import { AvatarUpload } from '@/components/dashboard/avatar-upload';
import { MutationFeedbackProvider } from '@/components/dashboard/mutation-feedback-provider';
import { MAIN_CONTENT_ID } from '@/lib/a11y/main-content';

/**
 * Browser-only harness for the real authenticated avatar upload component.
 * The route that renders this is disabled unless CODECARD_E2E_FIXTURES=1.
 */
export function UploadProgressHarness() {
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
          <h1 className="text-[24px] font-semibold">Avatar upload browser fixture</h1>
          <p className="mt-2 text-[14px] text-[var(--app-smoke)]">
            Exercises the authenticated avatar upload component without persistent storage.
          </p>
          <div className="mt-6">
            <AvatarUpload
              displayName="Upload Test User"
              initialAvatarUrl={null}
              refreshAfterSave={false}
              finalizeUpload={async () => ({
                success: true,
                avatarUrl: '/auth-collage/avatar.jpg',
              })}
            />
          </div>
        </section>
      </main>
    </MutationFeedbackProvider>
  );
}
