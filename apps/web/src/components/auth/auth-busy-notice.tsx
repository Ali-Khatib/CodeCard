'use client';

export function AuthBusyNotice({ children }: { children: string }) {
  return (
    <p
      role="status"
      aria-live="assertive"
      className="mb-4 flex items-center justify-center gap-2.5 rounded-[var(--app-radius-card,16px)] border border-[var(--app-border,rgba(34,34,34,0.1))] bg-[var(--app-bone,#fcf1e7)] px-4 py-3 text-[14px] font-medium text-[var(--app-ink,#232324)]"
    >
      <span
        className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[color-mix(in_srgb,var(--app-ink,#232324)_20%,transparent)] border-t-[var(--app-ink,#232324)] motion-reduce:animate-none"
        data-essential-loading="true"
        aria-hidden
      />
      {children}
    </p>
  );
}
