'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';
import { MAIN_CONTENT_ID } from '@/lib/a11y/main-content';

/**
 * Route-level error boundary. Keeps the root layout shell and reports to Sentry.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { surface: 'route-error' },
    });
  }, [error]);

  return (
    <main
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      className="relative flex min-h-[60dvh] max-w-[100vw] items-center justify-center px-6 py-16 text-[var(--app-ink)]"
    >
      <div className="mx-auto w-full max-w-lg text-center">
        <p className="font-eyebrow text-[10px] uppercase tracking-[0.18em] text-lavender/80">
          CodeCard
        </p>
        <h1 className="mt-4 break-words text-[32px] font-medium tracking-[-0.03em] md:text-[40px]">
          Something went wrong
        </h1>
        <p className="mt-4 break-words text-[16px] leading-relaxed text-[var(--app-smoke)]">
          An unexpected error occurred. Try again, or return to CodeCard home.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={() => reset()} className="cc-app-btn cc-app-btn--primary min-h-11">
            Try again
          </button>
          <Link href="/" className="cc-app-btn cc-app-btn--ghost min-h-11">
            Back to CodeCard
          </Link>
        </div>
      </div>
    </main>
  );
}
