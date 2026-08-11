'use client';

export function AuthBusyNotice({ children }: { children: string }) {
  return (
    <p
      role="status"
      aria-live="assertive"
      className="mb-4 flex items-center justify-center gap-2.5 rounded-[16px] border border-[rgba(34,34,34,0.08)] bg-[#fff9f3] px-4 py-3 text-[14px] font-medium text-[#222222]"
    >
      <span
        className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#222222]/20 border-t-[#222222] motion-reduce:animate-none"
        data-essential-loading="true"
        aria-hidden
      />
      {children}
    </p>
  );
}
