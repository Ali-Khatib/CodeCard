'use client';

import {
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'motion/react';

const IMG_PADDING = 12;

export type TextParallaxContentProps = {
  imgUrl: string;
  subheading: string;
  heading: string;
  research?: string;
  solution?: string;
  children?: ReactNode;
  className?: string;
};

/**
 * Sticky image + centered parallax overlay. Optional children = second sticky page.
 */
export function TextParallaxContent({
  imgUrl,
  subheading,
  heading,
  research,
  solution,
  children,
  className,
}: TextParallaxContentProps) {
  return (
    <div
      className={className}
      style={
        {
          paddingLeft: IMG_PADDING,
          paddingRight: IMG_PADDING,
        } as CSSProperties
      }
    >
      <div className="relative h-[150vh]">
        <StickyImage imgUrl={imgUrl} />
        <OverlayCopy
          heading={heading}
          subheading={subheading}
          research={research}
          solution={solution}
        />
      </div>
      {children ? <StickyFadePage>{children}</StickyFadePage> : null}
    </div>
  );
}

function StickyImage({ imgUrl }: { imgUrl: string }) {
  const targetRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['end end', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 0.85]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 0]);

  return (
    <motion.div
      ref={targetRef}
      style={{
        backgroundImage: `url(${imgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: `calc(100vh - ${IMG_PADDING * 2}px)`,
        top: IMG_PADDING,
        scale,
      }}
      className="sticky z-0 overflow-hidden rounded-3xl bg-neutral-950"
    >
      <motion.div
        className="absolute inset-0 bg-neutral-950/70"
        style={{ opacity }}
        aria-hidden
      />
    </motion.div>
  );
}

function StickyFadePage({ children }: { children: ReactNode }) {
  const targetRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['end end', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 0.85]);
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.55, 1],
    reduced ? [1, 1, 1] : [1, 1, 0],
  );

  return (
    <div className="relative h-[150vh]">
      <motion.div
        ref={targetRef}
        style={{
          height: `calc(100vh - ${IMG_PADDING * 2}px)`,
          top: IMG_PADDING,
          scale,
          opacity,
        }}
        className="sticky z-0 overflow-hidden rounded-3xl bg-white"
      >
        {children}
      </motion.div>
    </div>
  );
}

function OverlayCopy({
  subheading,
  heading,
  research,
  solution,
}: {
  subheading: string;
  heading: string;
  research?: string;
  solution?: string;
}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduced ? [0, 0] : [250, -250],
  );
  const opacity = useTransform(
    scrollYProgress,
    [0.25, 0.5, 0.75],
    reduced ? [1, 1, 1] : [0, 1, 0],
  );

  return (
    <motion.div
      ref={targetRef}
      style={{ y, opacity }}
      className="absolute left-0 top-0 flex h-screen w-full flex-col items-center justify-center px-6 text-white"
    >
      <p className="mb-2 text-center font-[family-name:var(--font-eyebrow)] text-sm uppercase tracking-[0.16em] text-[color:var(--ed-iris,#c094e4)] md:mb-4 md:text-base">
        {subheading}
      </p>
      <p className="max-w-4xl text-center font-[family-name:var(--font-display)] text-4xl font-normal leading-[1.05] tracking-[-0.03em] md:text-6xl lg:text-7xl">
        {heading}
      </p>
      {research ? (
        <>
          <p className="mt-8 text-center font-[family-name:var(--font-eyebrow)] text-sm uppercase tracking-[0.16em] text-[color:var(--ed-iris,#c094e4)] md:mt-10 md:text-base">
            The research
          </p>
          <p className="mt-4 max-w-3xl text-center text-xl leading-snug text-white/90 md:text-2xl md:leading-[1.35]">
            {research}
          </p>
        </>
      ) : null}
      {solution ? (
        <>
          <p className="mt-9 text-center font-[family-name:var(--font-eyebrow)] text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--ed-iris,#c094e4)] md:mt-11 md:text-base">
            The solution
          </p>
          <p className="mt-4 max-w-4xl text-center font-[family-name:var(--font-display)] text-3xl font-normal leading-[1.08] tracking-[-0.03em] text-white md:text-5xl md:leading-[1.05] lg:text-6xl">
            {solution}
          </p>
        </>
      ) : null}
    </motion.div>
  );
}
