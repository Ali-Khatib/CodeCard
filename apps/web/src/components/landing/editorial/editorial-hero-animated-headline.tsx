'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const PHRASES = [
  { id: 0, lead: 'BUILD A', punch: 'CONNECTION.' },
  { id: 1, lead: 'MAKE AN', punch: 'IMPACT.' },
  { id: 2, lead: 'LEAVE A', punch: 'MARK.' },
] as const;

const HOLD_MS = 4200;
const MOVE_S = 0.42;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function PhraseCopy({
  lead,
  punch,
}: {
  lead: string;
  punch: string;
}) {
  return (
    <span className="cc-ed-hero__rotating-line">
      <span className="cc-ed-hero__rotating-lead">{lead} </span>
      <span className="cc-ed-hero__rotating-punch">{punch}</span>
    </span>
  );
}

/** Client-only one-line rotating statement — keeps `editorial-hero.tsx` a server component for LCP. */
export function EditorialHeroAnimatedHeadline() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const phrase = PHRASES[index] ?? PHRASES[0];

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % PHRASES.length);
    }, HOLD_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="cc-ed-hero__phrase-stage" aria-live="polite" aria-atomic="true">
      {PHRASES.map((item) => (
        <span key={item.id} className="cc-ed-hero__phrase-measure" aria-hidden="true">
          <PhraseCopy lead={item.lead} punch={item.punch} />
        </span>
      ))}
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={phrase.id}
          className="cc-ed-hero__phrase"
          initial={reduced ? { opacity: 0 } : { y: '0.55em', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { y: '-0.4em', opacity: 0 }}
          transition={{ duration: reduced ? 0.16 : MOVE_S, ease: EASE }}
        >
          <PhraseCopy lead={phrase.lead} punch={phrase.punch} />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
