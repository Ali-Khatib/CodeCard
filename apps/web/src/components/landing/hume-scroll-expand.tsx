'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';

const SPAWN_ITEMS = [
  {
    title: 'Work-first layout',
    body: 'Visitors see projects before credentials — proof in the first scroll.',
  },
  {
    title: 'Share anywhere',
    body: 'QR, link, or your phone at a meetup. One CodeCard, every intro.',
  },
  {
    title: 'Track what lands',
    body: 'Profile views, project opens, and saves — without a trading-terminal dashboard.',
  },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function HumeScrollExpandSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });
  const reduced = useReducedMotion();
  const animate = inView || reduced;

  return (
    <section
      ref={ref}
      className="cc-hume-scroll-expand cc-hume-scroll-expand--static border-y border-[var(--border)] bg-paper py-20 md:py-28"
      aria-label="How CodeCard showcases your work"
    >
      <div className="cc-container">
        <motion.div
          className="cc-hume-scroll-expand__panel cc-hume-scroll-expand__panel--full mx-auto max-w-[1040px] overflow-hidden rounded-[24px]"
          initial={reduced ? false : 'hidden'}
          animate={animate ? 'show' : 'hidden'}
          variants={{
            hidden: { opacity: 0, y: 24 },
            show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
          }}
        >
          <div className="cc-hume-scroll-expand__inner !max-h-none !py-12 md:!py-16">
            <p className="cc-hume-scroll-expand__eyebrow !opacity-100">Public reach</p>

            <h2 className="cc-hume-scroll-expand__headline !text-ink">
              Your work, presented like it matters
            </h2>

            <ul className="cc-hume-scroll-expand__spawn-list mt-10">
              {SPAWN_ITEMS.map((item, i) => (
                <motion.li
                  key={item.title}
                  className="cc-hume-scroll-expand__spawn"
                  custom={i}
                  initial={reduced ? false : 'hidden'}
                  animate={animate ? 'show' : 'hidden'}
                  variants={fadeUp}
                >
                  <p className="cc-hume-scroll-expand__spawn-title">{item.title}</p>
                  <p className="cc-hume-scroll-expand__spawn-body">{item.body}</p>
                </motion.li>
              ))}
            </ul>

            <motion.div
              className="mt-10"
              custom={3}
              initial={reduced ? false : 'hidden'}
              animate={animate ? 'show' : 'hidden'}
              variants={fadeUp}
            >
              <LiveDemoLink className="cc-btn-pill-primary cc-instant-press inline-flex px-8 py-3 text-[15px]">
                Open live demo →
              </LiveDemoLink>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
