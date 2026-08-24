'use client';

import type { ReactNode } from 'react';

type EditorialHeroSceneProps = {
  hero: ReactNode;
};

const STATEMENT_BEATS = [
  {
    id: 'problem',
    lead: 'YOUR WORK BELONGS',
    sub: 'IN ONE PLACE.',
    title: 'YOUR WORK BELONGS IN ONE PLACE.',
    lede:
      'Projects, papers, people, and signals live in one CodeCard you can share.',
  },
  {
    id: 'shift',
    lead: 'SHOW WHAT YOU BUILD.',
    sub: 'RIGHT ON THE SPOT.',
    title: 'SHOW WHAT YOU BUILD. RIGHT ON THE SPOT.',
    lede: 'Open your card and they see the work clearly, right away.',
  },
  {
    id: 'identity',
    lead: 'ONE CARD.',
    sub: 'YOUR WHOLE STORY.',
    title: 'ONE CARD. YOUR WHOLE STORY.',
    lede: 'Hand someone your CodeCard. They get the full picture in one place.',
  },
] as const;

/**
 * Static IB-tight hero + CodeCard statement.
 * No load expand, no scroll cinema, no clip-path thrash.
 */
export function EditorialHeroScene({ hero }: EditorialHeroSceneProps) {
  return (
    <>
      <div
        className="cc-ed-hero-scene cc-ed-hero-scene--static"
        data-testid="editorial-hero-scene"
        data-chapter-section="hero"
        data-hero-intro="settled"
        data-cinema-chapter="hero"
      >
        <div className="cc-ed-hero-scene__stage">{hero}</div>
      </div>

      <section
        className="cc-ed-statement-static"
        data-testid="editorial-statement"
        aria-labelledby="editorial-statement-heading"
      >
        <div className="cc-ed-statement-static__chrome">
          <p className="cc-ed-statement-static__tag">
            <span className="cc-ed-statement-static__tag-mark" aria-hidden />
            What this is
          </p>
          <p className="cc-ed-statement-static__pager" aria-hidden>
            01 <span className="cc-ed-statement-static__pager-total">/ 03</span>
          </p>
        </div>

        <div className="cc-ed-statement-static__grid">
          {STATEMENT_BEATS.map((beat, i) => (
            <article
              key={beat.id}
              className="cc-ed-statement-static__card"
              data-statement-beat={beat.id}
            >
              {i === 0 ? (
                <h2
                  id="editorial-statement-heading"
                  className="cc-ed-statement-static__headline"
                >
                  <span className="cc-ed-statement-static__lead">{beat.lead}</span>
                  <span className="cc-ed-statement-static__sub">{beat.sub}</span>
                </h2>
              ) : (
                <h3 className="cc-ed-statement-static__headline">
                  <span className="cc-ed-statement-static__lead">{beat.lead}</span>
                  <span className="cc-ed-statement-static__sub">{beat.sub}</span>
                </h3>
              )}
              <p className="cc-ed-statement-static__lede">{beat.lede}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
