'use client';

import { useCallback, useState } from 'react';
import { PublicCodeCardQr } from './public-code-card-qr';
import { getPublicProfileLinkForClipboard } from '@/lib/sharing/qr';

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
      const url =
        getPublicProfileLinkForClipboard(profileSlug) ??
        `${window.location.origin}/${profileSlug}`;
      await navigator.clipboard.writeText(url);
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
          Copy the public link or show the QR that opens this CodeCard. Connecting happens after a
          scan, on this page.
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
        <div className="cc-qr-modal mx-auto flex max-w-sm flex-col items-center rounded-[16px] border border-[var(--app-border)] bg-[var(--app-paper)] p-5">
          <p className="cc-app-mono mb-3">Scan to open this CodeCard</p>
          <PublicCodeCardQr profileSlug={profileSlug} />
        </div>
      ) : null}
    </div>
  );
}
