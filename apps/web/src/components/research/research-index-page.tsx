'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import {
  ALL_SOURCES_LIST,
  type ResearchSource,
} from '@/lib/research/sources';
import { MARKETING_HOME_HREF } from '@/lib/marketing/site-routes';
import '@/styles/research-index.css';

function PaperRow({
  source,
  index,
}: {
  source: ResearchSource;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { amount: 0.2, once: true });
  const reduced = useReducedMotion();
  const n = String(index + 1).padStart(2, '0');

  return (
    <motion.li
      ref={ref}
      className="cc-research-index__paper"
      data-open={open ? 'true' : undefined}
      initial={reduced ? false : { opacity: 0, y: 36 }}
      animate={
        reduced || inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }
      }
      transition={{
        duration: 0.55,
        delay: Math.min(index * 0.04, 0.28),
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <button
        type="button"
        className="cc-research-index__paper-head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="cc-research-index__paper-num" aria-hidden>
          {n}
        </span>
        <span className="cc-research-index__paper-main">
          <span className="cc-research-index__paper-title">{source.title}</span>
          <span className="cc-research-index__paper-meta">
            {source.authors} · {source.year} · {source.studyType}
          </span>
        </span>
        <span className="cc-research-index__paper-toggle" aria-hidden>
          {open ? '−' : '+'}
        </span>
      </button>

      <div className="cc-research-index__paper-body" aria-hidden={!open}>
        <div
          className="cc-research-index__paper-body-inner"
          inert={!open ? true : undefined}
        >
          <dl className="cc-research-index__facts">
            <div>
              <dt>Sample</dt>
              <dd>{source.sampleSize}</dd>
            </div>
            <div>
              <dt>Finding</dt>
              <dd>{source.finding}</dd>
            </div>
            <div>
              <dt>Limitation</dt>
              <dd>{source.limitation}</dd>
            </div>
          </dl>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="cc-research-index__paper-link"
          >
            Open paper →
          </a>
        </div>
      </div>
    </motion.li>
  );
}

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const reduced = useReducedMotion();
  const y = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 80]);
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.85],
    [1, reduced ? 1 : 0.35],
  );

  return (
    <header ref={ref} className="cc-research-index__hero">
      <motion.div style={{ y, opacity }} className="cc-research-index__hero-inner">
        <p className="cc-research-index__eyebrow">Research</p>
        <h1 className="cc-research-index__display">
          <span>The papers</span>
          <span>behind the product.</span>
        </h1>
        <p className="cc-research-index__lede">
          Peer-reviewed studies, platform research, and UX sources that shape how
          CodeCard puts work where people can actually see it.
        </p>
      </motion.div>
    </header>
  );
}

/**
 * Marketing /research — New Form–inspired paper library.
 * Keeps CodeCard cream / ink / iris tokens (no palette swap).
 */
export function ResearchIndexPage() {
  const count = ALL_SOURCES_LIST.length;

  useEffect(() => {
    document.documentElement.dataset.navTone = 'light';
    return () => {
      delete document.documentElement.dataset.navTone;
    };
  }, []);

  return (
    <div className="cc-research-index" data-testid="research-index-page">
      <Hero />

      <section
        className="cc-research-index__papers"
        aria-labelledby="research-papers-heading"
      >
        <div className="cc-research-index__papers-intro">
          <p className="cc-research-index__eyebrow">Library</p>
          <h2 id="research-papers-heading" className="cc-research-index__section-title">
            All {count} sources.
          </h2>
          <p className="cc-research-index__lede cc-research-index__lede--tight">
            Open a row for sample, finding, and limits. Each links to the original
            paper.
          </p>
        </div>

        <ol className="cc-research-index__paper-list">
          {ALL_SOURCES_LIST.map((source, index) => (
            <PaperRow key={source.id} source={source} index={index} />
          ))}
        </ol>
      </section>

      <p className="cc-research-index__back">
        <Link href={MARKETING_HOME_HREF}>← Back to CodeCard</Link>
      </p>
    </div>
  );
}
