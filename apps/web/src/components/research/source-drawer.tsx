'use client';

import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!source) return;

    scrollYRef.current = window.scrollY;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKey);
    closeRef.current?.focus({ preventScroll: true });

    return () => {
      window.removeEventListener('keydown', onKey);
      window.scrollTo({ top: scrollYRef.current, behavior: 'auto' });
    };
  }, [source, onClose]);

  return (
    <AnimatePresence>
      {source && (
        <>
          <motion.button
            type="button"
            aria-label="Close study details"
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="source-drawer-title"
            className="fixed inset-x-4 bottom-4 z-[201] mx-auto max-h-[min(85vh,640px)] max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface shadow-[0_0_60px_rgba(178,150,248,0.2)] md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-border bg-surface/95 px-6 py-4 backdrop-blur-md">
              <div>
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
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[15px] font-semibold text-accent hover:underline"
              >
                External source →
              </a>
              <Link href="/#research" className="text-[15px] text-text-secondary hover:text-text-primary" onClick={onClose}>
                All references
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
