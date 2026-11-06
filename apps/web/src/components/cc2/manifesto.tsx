'use client';

import { useMemo, useRef } from 'react';
import { clamp } from './hooks';
import { useScrollTrack } from './scroll-bus';

const COPY =
  'Your profiles already say who you are. What was missing is a real introduction, where the work changes hands in person and the connection is genuine. That is CodeCard.';

/**
 * Scroll-scrubbed statement. The sentence lights up word by word as the
 * section is pinned. Writes opacity straight to the words; no React state.
 */
export function Cc2Manifesto() {
  const rootRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const words = useMemo(() => COPY.split(' '), []);
  const last = useRef<number[]>([]);

  useScrollTrack(rootRef, ({ pin }) => {
    const nodes = textRef.current?.children;
    if (!nodes) return;
    const n = nodes.length;
    // The front runs a little past the last word so it fully lights before unpinning.
    const front = clamp(pin / 0.86) * (n + 3) - 1.5;
    for (let i = 0; i < n; i += 1) {
      const o = 0.16 + 0.84 * clamp((front - i) / 2.4);
      const q = Math.round(o * 100);
      if (last.current[i] !== q) {
        last.current[i] = q;
        (nodes[i] as HTMLElement).style.opacity = String(q / 100);
      }
    }
    if (railRef.current) railRef.current.style.transform = `scaleY(${clamp(pin / 0.86).toFixed(3)})`;
  });

  return (
    <section
      ref={rootRef}
      id="order"
      className="cc2-manifesto cc2-tone cc2-tone--paper"
      aria-label="The order matters"
    >
      <div className="cc2-manifesto__pin">
        <div className="cc2-wrap cc2-manifesto__inner">
          <span className="cc2-manifesto__rail" aria-hidden>
            <span ref={railRef} className="cc2-manifesto__fill" />
          </span>
          <p ref={textRef} className="cc2-manifesto__text" aria-label={COPY}>
            {words.map((w, i) => (
              <span key={`${w}-${i}`} className="cc2-manifesto__word" aria-hidden style={{ opacity: 0.16 }}>
                {w}{' '}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
