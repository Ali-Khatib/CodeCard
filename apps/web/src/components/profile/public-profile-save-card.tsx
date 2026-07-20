'use client';

import { useCallback, useState } from 'react';

/** Bottom CTA — independent copy / QR (keeps hero actions out of the LCP path). */
export function PublicProfileSaveCard({
  profileSlug,
  displayName,
}: {
  profileSlug: string;
  displayName: string;
}) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const firstName = displayName.split(' ')[0];

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${profileSlug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [profileSlug]);

  return (
    <div className="space-y-4">
      <div className="cc-app-card cc-app-card--rose !p-8 text-center">
        <p className="cc-app-mono">Save this CodeCard</p>
        <h2 className="mt-3 text-[24px] font-medium tracking-[-0.025em] text-[var(--app-ink)]">
          Keep {firstName}&apos;s work handy
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-[var(--app-smoke)]">
          Copy the link, scan the QR, or save the contact for your next conversation.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="cc-app-btn cc-app-btn--primary"
            onClick={copyLink}
            aria-live="polite"
          >
            {copied ? 'Profile link copied' : 'Copy link'}
          </button>
          <button
            type="button"
            className="cc-app-btn cc-app-btn--ghost"
            onClick={() => setQrOpen((o) => !o)}
            aria-expanded={qrOpen}
          >
            Show QR code
          </button>
        </div>
      </div>
      {qrOpen ? (
        <div className="mx-auto flex max-w-sm flex-col items-center rounded-[16px] border border-[var(--app-border)] bg-[var(--app-paper)] p-5">
          <p className="cc-app-mono mb-3">Scan to open</p>
          <div className="grid h-40 w-40 max-w-full grid-cols-5 grid-rows-5 gap-px bg-[var(--app-bone)] p-2">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className={i % 2 === 0 ? 'bg-[var(--app-ink)]' : 'bg-transparent'}
              />
            ))}
          </div>
          <p className="mt-3 max-w-full break-all text-[14px] text-[var(--app-smoke)]">
            codecard.app/{profileSlug}
          </p>
        </div>
      ) : null}
    </div>
  );
}
