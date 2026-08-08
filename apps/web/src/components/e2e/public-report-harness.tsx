'use client';

import { PublicReportDialog } from '@/components/moderation/public-report-dialog';
import { MAIN_CONTENT_ID } from '@/lib/a11y/main-content';

export function PublicReportHarness() {
  return (
    <main
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      className="min-h-screen bg-[var(--app-bg)] p-6 text-[var(--app-ink)]"
    >
      <h1 className="text-2xl font-semibold">Public report fixture</h1>
      <p className="mt-2">A published profile rendered with a real page-derived target.</p>
      <div className="mt-6">
        <PublicReportDialog
          targetType="profile"
          targetId="11111111-1111-4111-8111-111111111111"
        />
      </div>
    </main>
  );
}
