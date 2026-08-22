'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';

const testimonials = [
  {
    quote: 'Transformed our entire creative process overnight.',
    author: 'Sarah Chen',
    role: 'Design Director',
    company: 'Linear',
  },
  {
    quote: 'The most elegant solution we ever implemented.',
    author: 'Marcus Webb',
    role: 'Creative Lead',
    company: 'Vercel',
  },
  {
    quote: 'Pure craftsmanship in every single detail.',
    author: 'Elena Frost',
    role: 'Head of Product',
    company: 'Stripe',
  },
] as const;

/** Standalone testimonial carousel — editorial orange accent via CSS vars. */
export function Testimonial() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 200 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);
  const numberX = useTransform(x, [-200, 200], [-20, 20]);
  const numberY = useTransform(y, [-200, 200], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - (rect.left + rect.width / 2));
    mouseY.set(e.clientY - (rect.top + rect.height / 2));
  };

  const goNext = () => setActiveIndex((prev) => (prev + 1) % testimonials.length);
  const goPrev = () =>
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  useEffect(() => {
    const timer = window.setInterval(goNext, 6000);
    return () => window.clearInterval(timer);
  }, []);

  const current = testimonials[activeIndex]!;

  return (
    <div className="cc-design-testimonial flex min-h-screen items-center justify-center overflow-hidden bg-bone">
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl px-6"
        onMouseMove={handleMouseMove}
      >
        <motion.div
          className="pointer-events-none absolute -left-8 top-1/2 select-none text-[28rem] font-bold leading-none tracking-tighter text-ink/[0.03]"
          style={{ x: numberX, y: numberY }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="block"
            >
              {String(activeIndex + 1).padStart(2, '0')}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        <div className="relative flex">
          <div className="flex flex-col items-center justify-center border-r border-border pr-16">
            <motion.span
              className="font-eyebrow text-xs uppercase tracking-widest text-smoke"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Testimonials
            </motion.span>
            <div className="relative mt-8 h-32 w-px bg-border">
              <motion.div
                className="absolute left-0 top-0 w-full origin-top bg-accent"
                animate={{
                  height: `${((activeIndex + 1) / testimonials.length) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          <div className="flex-1 py-12 pl-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-eyebrow text-xs text-smoke">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {current.company}
                </span>
              </motion.div>
            </AnimatePresence>

            <div className="relative mb-12 min-h-[140px]">
              <AnimatePresence mode="wait">
                <motion.blockquote
                  key={activeIndex}
                  className="font-display text-4xl font-light leading-[1.15] tracking-tight text-ink md:text-5xl"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {current.quote.split(' ').map((word, i) => (
                    <motion.span
                      key={i}
                      className="mr-[0.3em] inline-block"
                      variants={{
                        hidden: { opacity: 0, y: 20, rotateX: 90 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          rotateX: 0,
                          transition: {
                            duration: 0.5,
                            delay: i * 0.05,
                            ease: [0.22, 1, 0.36, 1],
                          },
                        },
                        exit: {
                          opacity: 0,
                          y: -10,
                          transition: { duration: 0.2, delay: i * 0.02 },
                        },
                      }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </motion.blockquote>
              </AnimatePresence>
            </div>

            <div className="flex items-end justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="flex items-center gap-4"
                >
                  <motion.div
                    className="h-px w-8 bg-ink"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    style={{ originX: 0 }}
                  />
                  <div>
                    <p className="text-base font-medium text-ink">{current.author}</p>
                    <p className="text-sm text-smoke">{current.role}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center gap-4">
                <motion.button
                  type="button"
                  onClick={goPrev}
                  className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border"
                  whileTap={{ scale: 0.95 }}
                  aria-label="Previous testimonial"
                >
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M10 12L6 8L10 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={goNext}
                  className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border"
                  whileTap={{ scale: 0.95 }}
                  aria-label="Next testimonial"
                >
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M6 4L10 8L6 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
