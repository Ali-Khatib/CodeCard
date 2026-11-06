'use client';

import { useRef } from 'react';
import { LIVE_DEMO_PROFILE_HREF } from '@/lib/marketing/demo-url';
import { useInViewOnce } from './hooks';
import { useScrollTrack } from './scroll-bus';

type Project = {
  id: string;
  title: string;
  tagline: string;
  tags: string[];
  art: 'emotion' | 'scan' | 'ocr' | 'graph';
};

const PROJECTS: Project[] = [
  {
    id: 'emotion',
    title: 'Context-aware emotion recognition',
    tagline: 'From one face to the mood of a whole room.',
    tags: ['Computer vision', 'Research'],
    art: 'emotion',
  },
  {
    id: 'sentinel',
    title: 'Sentinel',
    tagline: 'Anomaly detection on live video, on a single GPU.',
    tags: ['AI', 'Cloud'],
    art: 'scan',
  },
  {
    id: 'lumen',
    title: 'Lumen',
    tagline: 'On-device OCR that reads receipts in under a second.',
    tags: ['Mobile', 'OCR'],
    art: 'ocr',
  },
  {
    id: 'atlas',
    title: 'Atlas',
    tagline: 'Retrieval over forty million documents, with sources.',
    tags: ['LLMs', 'RAG'],
    art: 'graph',
  },
];

function Art({ kind }: { kind: Project['art'] }) {
  if (kind === 'emotion') {
    return (
      <div className="cc2-art cc2-art--emotion">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/showcase/emotion/interface-preview.png" alt="" loading="lazy" decoding="async" />
      </div>
    );
  }
  if (kind === 'scan') {
    return (
      <div className="cc2-art cc2-art--scan" aria-hidden>
        <span className="cc2-art__sweep" />
        <span className="cc2-art__box cc2-art__box--a" />
        <span className="cc2-art__box cc2-art__box--b" />
        <span className="cc2-art__box cc2-art__box--c" />
      </div>
    );
  }
  if (kind === 'ocr') {
    return (
      <div className="cc2-art cc2-art--ocr" aria-hidden>
        <p>Order 4471 · 14 Mar</p>
        <p>
          Flat white <span>3.40</span>
        </p>
        <p>
          Almond croissant <span>4.20</span>
        </p>
        <p className="cc2-art__hit">
          Total <span>7.60</span>
        </p>
        <p>Thank you</p>
      </div>
    );
  }
  return (
    <svg className="cc2-art cc2-art--graph" viewBox="0 0 400 260" aria-hidden>
      <g className="cc2-art__edges">
        <path d="M200 130 L90 60 M200 130 L310 56 M200 130 L96 206 M200 130 L318 210 M90 60 L40 130 M310 56 L360 130 M96 206 L40 130 M318 210 L360 130" />
      </g>
      <g className="cc2-art__nodes">
        <circle cx="200" cy="130" r="14" className="cc2-art__core" />
        <circle cx="90" cy="60" r="8" />
        <circle cx="310" cy="56" r="8" />
        <circle cx="96" cy="206" r="8" />
        <circle cx="318" cy="210" r="8" />
        <circle cx="40" cy="130" r="5" />
        <circle cx="360" cy="130" r="5" />
      </g>
    </svg>
  );
}

/**
 * Featured work, the way the product describes it: still posters that come
 * alive as they reach the centre of the screen. Scale and brightness follow
 * the card's distance from centre; the nearest card plays.
 */
export function Cc2Work() {
  const rootRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const active = useRef(-1);
  const [headRef, headSeen] = useInViewOnce<HTMLDivElement>(0.35);

  useScrollTrack(rootRef, ({ viewportH }) => {
    let best = -1;
    let bestD = Infinity;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const r = card.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - viewportH / 2) / viewportH;
      const t = Math.min(1, d / 0.75);
      const scale = 1 - t * 0.075;
      card.style.setProperty('--k', String((1 - t).toFixed(3)));
      card.style.transform = `scale(${scale.toFixed(4)})`;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    const next = bestD < 0.34 ? best : -1;
    if (next !== active.current) {
      active.current = next;
      cardRefs.current.forEach((card, i) => {
        if (card) card.dataset.active = i === next ? 'true' : 'false';
      });
    }
  });

  return (
    <section
      ref={rootRef}
      id="work"
      className="cc2-work cc2-tone cc2-tone--paper"
      aria-labelledby="cc2-work-title"
    >
      <div className="cc2-wrap">
        <div ref={headRef} className="cc2-work__head" data-in={headSeen ? 'true' : 'false'}>
          <h2 id="cc2-work-title" className="cc2-h2">
            <span className="cc2-line" style={{ ['--i' as string]: 0 }}>
              <span className="cc2-line__in">Work first.</span>
            </span>
            <span className="cc2-line" style={{ ['--i' as string]: 1 }}>
              <span className="cc2-line__in">Strongest at the top.</span>
            </span>
          </h2>
          <p className="cc2-lede cc2-work__lede">
            Every project is a card. Posters stay still until you reach them, then they play.
          </p>
        </div>

        <ul className="cc2-work__list">
          {PROJECTS.map((p, i) => (
            <li key={p.id}>
              <a
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                href={LIVE_DEMO_PROFILE_HREF}
                className="cc2-work__card"
                data-active="false"
                data-art={p.art}
                aria-label={`${p.title}. ${p.tagline} Opens the live demo.`}
              >
                <div className="cc2-work__media">
                  <Art kind={p.art} />
                  <span className="cc2-work__play" aria-hidden>
                    <i />
                    Playing
                  </span>
                </div>
                <div className="cc2-work__meta">
                  <div>
                    <h3>{p.title}</h3>
                    <p>{p.tagline}</p>
                  </div>
                  <ul className="cc2-work__tags" aria-hidden>
                    {p.tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </a>
            </li>
          ))}
        </ul>
        <p className="cc2-work__note">Sample projects. Yours go here.</p>
      </div>
    </section>
  );
}
