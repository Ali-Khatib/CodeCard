import Link from 'next/link';
import { MAIN_CONTENT_ID } from '@/lib/a11y/main-content';

/**
 * WS11-T002 — Rendered with HTTP 403 when `forbidden()` is thrown
 * (currently the `/admin` gate). Opaque by design: no admin details,
 * role configuration, or error internals.
 */
export default function Forbidden() {
  return (
    <main
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      className="relative flex min-h-[100dvh] max-w-[100vw] items-center justify-center px-6 py-16 text-[var(--app-ink)]"
    >
      <div className="mx-auto w-full max-w-lg text-center">
        <p className="font-eyebrow text-[10px] uppercase tracking-[0.18em] text-lavender/80">
          CodeCard
        </p>
        <h1 className="mt-4 break-words text-[32px] font-medium tracking-[-0.03em] md:text-[40px]">
          Access denied
        </h1>
        <p className="mt-4 break-words text-[16px] leading-relaxed text-[var(--app-smoke)]">
          Your account doesn&apos;t have permission to view this page.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard" className="cc-app-btn cc-app-btn--primary min-h-11">
            Back to dashboard
          </Link>
          <Link href="/" className="cc-app-btn cc-app-btn--ghost min-h-11">
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
