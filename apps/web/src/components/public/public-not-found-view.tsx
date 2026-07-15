import Link from 'next/link';

/**
 * Friendly public not-found UI.
 * Uses the same visitor-facing copy for missing and inaccessible content.
 */
export function PublicNotFoundView({
  heading = 'Page not found',
  message = 'This page is unavailable. It may have moved or never existed.',
}: {
  heading?: string;
  message?: string;
}) {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center px-6 py-16 text-[var(--app-ink)]">
      <div className="mx-auto w-full max-w-lg text-center">
        <p className="font-eyebrow text-[10px] uppercase tracking-[0.18em] text-lavender/80">
          CodeCard
        </p>
        <h1 className="mt-4 text-[32px] font-medium tracking-[-0.03em] md:text-[40px]">{heading}</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-[var(--app-smoke)]">{message}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="cc-app-btn cc-app-btn--primary">
            Back to CodeCard
          </Link>
          <Link href="/pricing" className="cc-app-btn cc-app-btn--ghost">
            View pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
