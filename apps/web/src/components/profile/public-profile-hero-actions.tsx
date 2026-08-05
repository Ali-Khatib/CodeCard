'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCopySuccessFlash } from '@/components/interactions/glow-press';
import { MOTION_FEEDBACK } from '@/components/motion/motion-tokens';

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
  const copyBtnRef = useRef<HTMLButtonElement>(null);
  const qrToggleRef = useRef<HTMLButtonElement>(null);
  const qrModalRef = useRef<HTMLDivElement>(null);
  const qrCloseRef = useRef<HTMLButtonElement>(null);
  const flashCopy = useCopySuccessFlash(MOTION_FEEDBACK.successMs);

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

  useEffect(() => {
    if (!qrOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const toggleEl = qrToggleRef.current;
    const focusTarget = qrCloseRef.current ?? qrModalRef.current;
    focusTarget?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setQrOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !qrModalRef.current) return;
      const focusables = qrModalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      (previouslyFocused ?? toggleEl)?.focus();
    };
  }, [qrOpen]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${profileSlug}`);
      setCopied(true);
      flashCopy(copyBtnRef.current);
      window.setTimeout(() => setCopied(false), MOTION_FEEDBACK.successMs);
    } catch {
      /* ignore */
    }
  }, [flashCopy, profileSlug]);

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
          ref={copyBtnRef}
          type="button"
          className={`cc-app-btn cc-app-btn--primary cc-copy-feedback !h-10${copied ? ' cc-copy-success' : ''}`}
          onClick={copyLink}
          aria-live="polite"
          data-testid="profile-copy-link"
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <button
          ref={qrToggleRef}
          type="button"
          className="cc-app-btn cc-app-btn--ghost cc-instant-press !h-10"
          onClick={() => setQrOpen((o) => !o)}
          aria-expanded={qrOpen}
          aria-controls="profile-qr-dialog"
          data-testid="profile-qr-toggle"
        >
          QR code
        </button>
      </div>

      {qrOpen ? (
        <div
          ref={qrModalRef}
          id="profile-qr-dialog"
          className="cc-qr-modal mt-4 flex max-w-full flex-col items-start rounded-[16px] border border-[var(--app-border)] bg-[var(--app-paper)] p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Profile QR code"
          tabIndex={-1}
          data-testid="profile-qr-modal"
        >
          <div className="mb-3 flex w-full items-center justify-between gap-3">
            <p className="cc-app-mono">Scan to open</p>
            <button
              ref={qrCloseRef}
              type="button"
              className="cc-app-btn cc-app-btn--ghost cc-qr-modal__close !h-11 !w-11 !min-h-[44px] !min-w-[44px] !p-0"
              aria-label="Close QR code"
              data-testid="profile-qr-close"
              onClick={() => setQrOpen(false)}
            >
              ×
            </button>
          </div>
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
