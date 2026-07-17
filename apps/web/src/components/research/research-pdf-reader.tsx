'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { HiOutlineArrowTopRightOnSquare, HiXMark } from 'react-icons/hi2';
import dynamic from 'next/dynamic';
import { HUME_EASE, HUME_MOTION } from '@/lib/motion/hume-motion';
import { publicResearchPdfPath } from '@/lib/research/public-research-pdf-path';
import { describeExternalPdfSource } from '@/lib/research/research-external-pdf';
import type { ResearchPdfPagesStatus } from './research-pdf-pages';

const ResearchPdfPages = dynamic(
  () => import('./research-pdf-pages').then((m) => m.ResearchPdfPages),
  {
    ssr: false,
    loading: () => (
      <p className="py-16 text-center text-[15px] text-[var(--app-smoke)]" role="status" aria-live="polite">
        Loading paper…
      </p>
    ),
  },
);

export type ResearchPdfReaderPaper = {
  id: string;
  title: string;
  abstract?: string | null;
  authors?: string[];
  venue?: string | null;
  pdfUrl: string | null;
};

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
}

function lockBackgroundScroll(scrollY: number) {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
}

function unlockBackgroundScroll(scrollY: number) {
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  document.body.style.paddingRight = '';
  window.scrollTo({ top: scrollY, behavior: 'auto' });
}

export function ResearchPdfReader({
  open,
  onClose,
  paper,
  triggerRef,
  savedScrollY,
}: {
  open: boolean;
  onClose: () => void;
  paper: ResearchPdfReaderPaper;
  triggerRef?: React.RefObject<HTMLElement | null>;
  /** Scroll Y captured synchronously when opening (before React re-render). */
  savedScrollY?: number | null;
}) {
  const titleId = useId();
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const historyPushedRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [pageStatus, setPageStatus] = useState<ResearchPdfPagesStatus>('loading');
  const [showFallback, setShowFallback] = useState(false);

  const externalHref = paper.pdfUrl;
  const sourceLabel = describeExternalPdfSource(externalHref);
  const authorsLine =
    paper.authors && paper.authors.length > 0 ? paper.authors.join(', ') : null;
  const subtitle = [authorsLine, paper.venue].filter(Boolean).join(' · ');
  const pdfSrc = publicResearchPdfPath(paper.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setPageStatus('loading');
      setShowFallback(false);
      return;
    }
    setRetryKey((k) => k + 1);
    setShowFallback(false);
    setPageStatus('loading');
  }, [open, paper.id]);

  useEffect(() => {
    if (pageStatus === 'error') {
      setShowFallback(true);
    }
  }, [pageStatus]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Scroll lock + focus trap. Prefer scroll Y captured on click so a pre-effect
  // layout/history jump cannot wipe the user's position.
  useEffect(() => {
    if (!open) return;

    const fromBodyTop = Math.abs(Number.parseInt(document.body.style.top || '0', 10)) || 0;
    const scrollY =
      typeof savedScrollY === 'number' && Number.isFinite(savedScrollY)
        ? savedScrollY
        : fromBodyTop || window.scrollY;

    lockBackgroundScroll(scrollY);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = getFocusable(dialogRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    closeRef.current?.focus({ preventScroll: true });

    return () => {
      window.removeEventListener('keydown', onKey);
      unlockBackgroundScroll(scrollY);
      triggerRef?.current?.focus({ preventScroll: true });
    };
  }, [open, handleClose, triggerRef, savedScrollY]);

  // Browser back closes the reader where history APIs are available.
  useEffect(() => {
    if (!open) return;

    const previousScrollRestoration = window.history.scrollRestoration;
    try {
      window.history.scrollRestoration = 'manual';
      window.history.pushState({ codecardPdfReader: true }, '');
      historyPushedRef.current = true;
    } catch {
      historyPushedRef.current = false;
    }

    const onPopState = () => {
      historyPushedRef.current = false;
      onClose();
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('popstate', onPopState);
      historyPushedRef.current = false;
      try {
        window.history.scrollRestoration = previousScrollRestoration;
      } catch {
        // ignore
      }
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const motionProps = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.01 },
      }
    : {
        initial: { opacity: 0, scale: 0.96, y: 18 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.98, y: 12 },
        transition: { duration: HUME_MOTION.pageTransition, ease: HUME_EASE },
      };

  const backdropProps = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.01 },
      }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: HUME_MOTION.pageTransition, ease: HUME_EASE },
      };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[220]" role="presentation" data-research-pdf-reader="true">
          <motion.button
            type="button"
            aria-label="Close paper reader"
            className="absolute inset-0 hidden bg-black/70 backdrop-blur-sm md:block"
            {...backdropProps}
            onClick={handleClose}
          />

          <div className="absolute inset-0 flex items-stretch justify-center md:items-center md:p-6 lg:p-10">
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              data-research-pdf-dialog="true"
              className="flex h-[100dvh] w-full max-w-none flex-col overflow-hidden border-0 bg-[var(--app-canvas,#0b0618)] text-[var(--app-ink,#f4f0ff)] shadow-none md:h-[min(92dvh,920px)] md:max-w-5xl md:rounded-2xl md:border md:border-white/12 md:shadow-[0_0_60px_rgba(0,0,0,0.45)]"
              style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
              {...motionProps}
              onClick={(e) => e.stopPropagation()}
            >
              <header className="sticky top-0 z-10 flex shrink-0 items-start gap-3 border-b border-white/10 bg-[var(--app-canvas,#0b0618)]/95 px-4 py-3 backdrop-blur-md sm:px-5">
                <div className="min-w-0 flex-1">
                  <h2 id={titleId} className="truncate text-[17px] font-semibold leading-snug sm:text-[18px]">
                    {paper.title}
                  </h2>
                  {subtitle && (
                    <p className="mt-0.5 truncate text-[13px] text-[var(--app-smoke,#b9b2ca)]">{subtitle}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {externalHref && (
                    <a
                      href={externalHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cc-app-btn cc-app-btn--ghost !h-10 !px-3"
                      aria-label="Open original PDF (opens in a new tab)"
                      title={sourceLabel ?? 'Open original PDF'}
                    >
                      <HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                      <span className="hidden sm:inline">Open original</span>
                      <span className="sm:hidden">Original</span>
                    </a>
                  )}
                  <button
                    ref={closeRef}
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[var(--app-ink)] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-iris)]"
                    aria-label="Close paper reader"
                    onClick={handleClose}
                  >
                    <HiXMark className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-4 sm:px-5">
                {showFallback ? (
                  <ReaderFallback
                    paper={paper}
                    externalHref={externalHref}
                    sourceLabel={sourceLabel}
                    onRetry={() => {
                      setShowFallback(false);
                      setPageStatus('loading');
                      setRetryKey((k) => k + 1);
                    }}
                    onClose={handleClose}
                  />
                ) : (
                  <ResearchPdfPages
                    src={pdfSrc}
                    retryKey={retryKey}
                    onStatusChange={setPageStatus}
                  />
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function ReaderFallback({
  paper,
  externalHref,
  sourceLabel,
  onRetry,
  onClose,
}: {
  paper: ResearchPdfReaderPaper;
  externalHref: string | null;
  sourceLabel: string | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-2 py-8" role="alert" aria-live="assertive">
      <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--app-iris,#9382ff)]">
        Preview unavailable
      </p>
      <h3 className="mt-3 text-[22px] font-semibold leading-snug">{paper.title}</h3>
      {paper.authors && paper.authors.length > 0 && (
        <p className="mt-2 text-[15px] text-[var(--app-smoke)]">{paper.authors.join(', ')}</p>
      )}
      {paper.venue && <p className="mt-1 text-[14px] text-[var(--app-smoke)]">{paper.venue}</p>}
      {paper.abstract && (
        <p className="mt-5 text-[16px] leading-relaxed text-[var(--app-smoke)]">{paper.abstract}</p>
      )}
      <p className="mt-6 text-[15px] leading-relaxed text-[var(--app-smoke)]">
        The embedded preview could not be loaded. The paper may still be available at the original
        link.
        {sourceLabel ? ` ${sourceLabel}.` : ''}
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        {externalHref && (
          <a
            href={externalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="cc-app-btn cc-app-btn--primary"
            aria-label="Open original PDF (opens in a new tab)"
          >
            <HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
            Open original
          </a>
        )}
        <button type="button" className="cc-app-btn cc-app-btn--ghost" onClick={onRetry}>
          Try again
        </button>
        <button type="button" className="cc-app-btn cc-app-btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export function ResearchPdfReadButton({
  paper,
  className = 'cc-app-btn cc-app-btn--ghost',
  children,
  onOpenTrack,
}: {
  paper: ResearchPdfReaderPaper;
  profileId?: string;
  className?: string;
  children?: ReactNode;
  onOpenTrack?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [savedScrollY, setSavedScrollY] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (!paper.pdfUrl) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={className}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Read paper: ${paper.title}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const scrollY = window.scrollY;
          setSavedScrollY(scrollY);
          // Lock immediately so React re-render / history cannot jump the page.
          lockBackgroundScroll(scrollY);
          onOpenTrack?.();
          setOpen(true);
        }}
      >
        {children ?? 'Read paper'}
      </button>
      <ResearchPdfReader
        open={open}
        onClose={() => setOpen(false)}
        paper={paper}
        triggerRef={triggerRef}
        savedScrollY={savedScrollY}
      />
    </>
  );
}
