'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { HiOutlineInformationCircle, HiXMark } from 'react-icons/hi2';
import type { ResearchSource } from '@/lib/research/sources';
import { useResearchSource } from './research-provider';

interface SourceDrawerProps {
  source: ResearchSource | null;
  onClose: () => void;
}

export function SourceInfoIcon({
  sourceId,
  label,
  className = '',
}: {
  sourceId: string;
  label?: string;
  className?: string;
}) {
  const { openSource } = useResearchSource();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openSource(sourceId);
      }}
      aria-label={label ?? 'View study details'}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-accent transition-colors hover:border-accent/50 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
    >
      <HiOutlineInformationCircle className="text-lg" aria-hidden />
    </button>
  );
}

export function SourceDrawer({ source, onClose }: SourceDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollYRef = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!source) return;

    scrollYRef.current = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKey);
    closeRef.current?.focus({ preventScroll: true });

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
      window.scrollTo({ top: scrollYRef.current, behavior: 'auto' });
    };
  }, [source, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {source && (
        <div className="fixed inset-0 z-[200]" role="presentation">
          <motion.button
            type="button"
            aria-label="Close study details"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="absolute inset-0 flex items-end justify-center p-4 sm:items-center sm:p-6">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="source-drawer-title"
              className="flex w-full max-w-lg max-h-[min(90dvh,720px)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_0_60px_rgba(178,150,248,0.2)]"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-surface px-6 py-4">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">Source</p>
                  <h2 id="source-drawer-title" className="mt-1 text-[20px] font-bold leading-snug">
                    {source.title}
                  </h2>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <HiXMark className="text-xl" aria-hidden />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <dl className="space-y-4 px-6 py-5 text-[17px]">
                  <div>
                    <dt className="text-[13px] font-semibold uppercase tracking-wide text-text-secondary">Authors</dt>
                    <dd className="mt-1">{source.authors}</dd>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-[13px] font-semibold uppercase tracking-wide text-text-secondary">Year</dt>
                      <dd className="mt-1">{source.year}</dd>
                    </div>
                    <div>
                      <dt className="text-[13px] font-semibold uppercase tracking-wide text-text-secondary">Study type</dt>
                      <dd className="mt-1">{source.studyType}</dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-[13px] font-semibold uppercase tracking-wide text-text-secondary">Sample</dt>
                    <dd className="mt-1 text-text-secondary">{source.sampleSize}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] font-semibold uppercase tracking-wide text-text-secondary">Finding</dt>
                    <dd className="mt-1 leading-relaxed">{source.finding}</dd>
                  </div>
                  <div className="rounded-lg border border-border bg-canvas/60 p-4">
                    <dt className="text-[13px] font-semibold uppercase tracking-wide text-text-secondary">Limitation</dt>
                    <dd className="mt-1 text-[16px] leading-relaxed text-text-secondary">{source.limitation}</dd>
                  </div>
                </dl>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-surface px-6 py-4">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] font-semibold text-accent hover:underline"
                >
                  External source →
                </a>
                <Link
                  href="/research/references"
                  className="text-[15px] text-text-secondary hover:text-text-primary"
                  onClick={onClose}
                >
                  All references
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
