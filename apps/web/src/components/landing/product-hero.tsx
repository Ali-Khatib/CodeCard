'use client';

import { useEffect, type CSSProperties } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import {
  Code2,
  Cpu,
  Database,
  GitBranch,
  Globe,
  Layers,
  Terminal,
  Zap,
} from 'lucide-react';
import { useHeroParallax } from '@/hooks/use-hero-parallax';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { CODECARD_TAGLINE } from '@/lib/marketing/positioning';

const FLOAT_ICONS = [
  { Icon: Code2, x: '8%', y: '18%', size: 28, delay: 0, duration: 9 },
  { Icon: GitBranch, x: '88%', y: '14%', size: 32, delay: 0.6, duration: 10 },
  { Icon: Terminal, x: '14%', y: '72%', size: 26, delay: 1.2, duration: 8.5 },
  { Icon: Database, x: '82%', y: '68%', size: 30, delay: 0.3, duration: 11 },
  { Icon: Cpu, x: '72%', y: '28%', size: 24, delay: 1.8, duration: 9.5 },
  { Icon: Layers, x: '22%', y: '42%', size: 22, delay: 0.9, duration: 10.5 },
  { Icon: Globe, x: '58%', y: '78%', size: 26, delay: 1.5, duration: 8 },
  { Icon: Zap, x: '46%', y: '12%', size: 20, delay: 2.1, duration: 7.5 },
] as const;

export function ProductHero() {
  const heroRef = useHeroParallax<HTMLElement>();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const section = heroRef.current;
    if (!section) return;

    const statement = section.querySelector('[data-hero-statement]');
    const pitch = section.querySelector('[data-hero-pitch]');
    const cta = section.querySelector('[data-hero-cta]');

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (statement) {
        tl.fromTo(statement, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.85 }, 0);
      }
      if (pitch) {
        tl.fromTo(pitch, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, 0.14);
      }
      if (cta) {
        tl.fromTo(cta, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.65 }, 0.28);
      }
    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={heroRef}
      className="cc-hume-hero relative flex min-h-[min(78svh,720px)] scroll-mt-28 flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-[104px] text-center text-ink md:pb-24 md:pt-[112px]"
      data-testid="hero-section"
    >
      <div className="cc-hume-hero__blobs pointer-events-none" aria-hidden />

      {!reducedMotion && (
        <div className="cc-hume-hero__float-icons pointer-events-none" aria-hidden>
          {FLOAT_ICONS.map(({ Icon, x, y, size, delay, duration }, i) => (
            <span
              key={i}
              className="cc-hume-hero__float-icon"
              style={
                {
                  left: x,
                  top: y,
                  '--float-size': `${size}px`,
                  '--float-delay': `${delay}s`,
                  '--float-duration': `${duration}s`,
                } as CSSProperties
              }
            >
              <Icon size={size} strokeWidth={1.5} />
            </span>
          ))}
        </div>
      )}

      <div className="relative z-[1] flex w-full max-w-[980px] flex-col items-center">
        <h1
          data-hero-statement
          className="cc-hume-hero__headline max-w-[920px] text-balance"
        >
          Your best work. Ready to{' '}
          <span className="cc-hume-gradient-text">share in seconds.</span>
        </h1>

        <p
          data-hero-pitch
          className="cc-hume-hero__tagline mt-6 max-w-[620px] text-balance"
        >
          {CODECARD_TAGLINE}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3" data-hero-cta>
          <Link href="/sign-up" className="cc-btn-pill-primary cc-instant-press h-11 px-8 text-[15px]">
            Start free →
          </Link>
          <LiveDemoLink className="cc-btn-pill-ghost cc-instant-press h-11 px-8 text-[15px]">
            Live demo
          </LiveDemoLink>
        </div>
      </div>
    </section>
  );
}
