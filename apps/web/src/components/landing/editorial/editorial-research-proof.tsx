'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { RESEARCH_INSIGHTS } from '@/lib/research/insights';

type GrowSpec = {
  end: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
};

const GROWS: Record<string, GrowSpec> = {
  attention: { end: 6, prefix: '~', suffix: ' sec' },
  pedigree: { end: 15, prefix: 'Nearly +', suffix: ' pts' },
  proof: { end: 6.1, decimals: 1, prefix: 'Up to ', suffix: '×' },
};

function GrowingStat({
  end,
  decimals = 0,
  prefix = '',
  suffix = '',
  active,
}: GrowSpec & { active: boolean }) {
  const reduced = useReducedMotion();
  const zero = decimals > 0 ? (0).toFixed(decimals) : '0';
  const [text, setText] = useState(`${prefix}${zero}${suffix}`);

  useEffect(() => {
    if (!active) return;
    const finalCore = decimals > 0 ? end.toFixed(decimals) : String(Math.round(end));
    if (reduced) {
      setText(`${prefix}${finalCore}${suffix}`);
      return;
    }

    const durationMs = 1400;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      const value = end * eased;
      const core =
        decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
      setText(`${prefix}${core}${suffix}`);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    setText(`${prefix}${zero}${suffix}`);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, decimals, end, prefix, reduced, suffix, zero]);

  return <span className="cc-ed-proof__stat-num">{text}</span>;
}

  const LANDING_PROOF = [
    {
      id: 'attention',
      title: 'First passes are short',
      finding:
        'Eye-tracking research found early résumé scans often lasted about six seconds—name, title, and school drew the first look before deeper project detail.',
    },
    {
      id: 'pedigree',
      title: 'Context shapes outcomes',
      finding:
        'In an audit study with identical qualifications, school and firm signals shifted callbacks by nearly 15 points. Clearer proof helps skill compete on equal footing.',
    },
    {
      id: 'proof',
      title: 'Visible skills travel farther',
      finding:
        'LinkedIn’s 2025 skills-based hiring research: pools can widen up to 6.1× when skills are easy to see up front—not buried below the fold.',
    },
  ] as const;

/**
 * Research importance — animated growing stats that argue for CodeCard.
 */
export function EditorialResearchProof() {
  const rootRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.28 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={rootRef}
      id="why-research"
      className="cc-ed__section cc-ed-proof"
      data-chapter-section="proof"
      data-testid="editorial-research-proof"
      aria-labelledby="editorial-research-proof-heading"
    >
      <div className="cc-ed-proof__intro">
        <p className="cc-ed__eyebrow">The research</p>
        <h2 id="editorial-research-proof-heading" className="cc-ed__display mt-3">
          FIRST LOOKS ARE FAST.
          <br />
          <span className="cc-ed__accent">MAKE THE WORK EASY TO SEE.</span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-4">
          Studies on how people scan profiles and résumés point to the same
          opportunity: put your proof where it’s easy to find.
        </p>
      </div>

      <div className="cc-ed-proof__grid">
        {LANDING_PROOF.map((insight) => {
          const grow = GROWS[insight.id] ?? { end: 0 };
          return (
            <article key={insight.id} className="cc-ed-proof__card">
              <GrowingStat {...grow} active={active} />
              <h3 className="cc-ed-proof__title">{insight.title}</h3>
              <p className="cc-ed-proof__finding">{insight.finding}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
