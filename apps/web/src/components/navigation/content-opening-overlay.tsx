'use client';

import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  contentOpeningHeadline,
  contentOpeningTitle,
  type ContentOpeningState,
} from '@/lib/navigation/content-opening';

/** Lazy overlay — keeps motion/react out of the ContentOpeningProvider critical chunk. */
export function ContentOpeningOverlayLazy({
  opening,
  reducedMotion,
}: {
  opening: ContentOpeningState;
  reducedMotion: boolean | null;
}) {
  const headline = contentOpeningHeadline(opening.kind);
  const title = contentOpeningTitle(opening.kind, opening.title);

  return createPortal(
    <motion.div
      className="cc-content-opening"
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="content-opening-overlay"
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0.12 : 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="cc-content-opening__panel">
        {reducedMotion ? (
          <span className="cc-content-opening__dot" aria-hidden />
        ) : (
          <>
            <span className="cc-content-opening__brand" aria-hidden>
              Cc
            </span>
            <span className="cc-content-opening__spinner" aria-hidden />
          </>
        )}
        <p className="cc-content-opening__headline">{headline}</p>
        <p className="cc-content-opening__title">{title}</p>
      </div>
    </motion.div>,
    document.body,
  );
}
