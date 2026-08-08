import { MAIN_CONTENT_ID } from '@/lib/a11y/main-content';

export default function AdminLoading() {
  return (
    <main
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <h1 className="text-3xl font-semibold">Moderation</h1>
      <p className="mt-3 text-[var(--app-smoke)]">Loading moderation queues…</p>
      <div className="mt-10 grid gap-4" aria-hidden>
        <div className="h-32 animate-pulse rounded-2xl bg-black/5" />
        <div className="h-32 animate-pulse rounded-2xl bg-black/5" />
      </div>
    </main>
  );
}
