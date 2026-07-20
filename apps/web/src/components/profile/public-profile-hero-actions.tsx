'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';

const PublicProfileViewerChrome = dynamic(
  () =>
    import('./public-profile-viewer-chrome').then((m) => m.PublicProfileViewerChrome),
  { ssr: false },
);

type ViewerConnection = {
  isOwnProfile: boolean;
  isAuthenticated: boolean;
  initiallyConnected: boolean;
  initialConnectionId: string | null;
};

/**
 * Interactive hero chrome for public profiles.
 * Copy/QR paint immediately; auth-aware connect/report loads after idle
 * so Supabase is off the LCP critical path (WS14-T019).
 */
export function PublicProfileHeroActions({
  profileId,
  profileSlug,
  displayName,
  connectionControl,
}: {
  profileId?: string;
  profileSlug: string;
  displayName: string;
  /** When provided (e.g. dashboard preview), skip client session lookup. */
  connectionControl?: ViewerConnection | null;
}) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [viewerReady, setViewerReady] = useState(Boolean(connectionControl));

  useEffect(() => {
    if (connectionControl || !profileId) {
      setViewerReady(Boolean(connectionControl) || false);
      return;
    }

    let cancelled = false;
    const enable = () => {
      if (!cancelled) setViewerReady(true);
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(enable, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const t = globalThis.setTimeout(enable, 1);
    return () => {
      cancelled = true;
      globalThis.clearTimeout(t);
    };
  }, [connectionControl, profileId]);

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
    <>
      <div className="flex flex-wrap items-center gap-3">
        {profileId && viewerReady ? (
          <PublicProfileViewerChrome
            profileId={profileId}
            profileSlug={profileSlug}
            displayName={displayName}
            connectionControl={connectionControl}
          />
        ) : null}
        <button
          type="button"
          className="cc-app-btn cc-app-btn--primary !h-10"
          onClick={copyLink}
          aria-live="polite"
        >
          {copied ? 'Profile link copied' : 'Copy link'}
        </button>
        <button
          type="button"
          className="cc-app-btn cc-app-btn--ghost !h-10"
          onClick={() => setQrOpen((o) => !o)}
          aria-expanded={qrOpen}
        >
          QR code
        </button>
      </div>

      {qrOpen ? (
        <div className="flex max-w-full flex-col items-start rounded-[16px] border border-[var(--app-border)] bg-[var(--app-paper)] p-5">
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
    </>
  );
}
