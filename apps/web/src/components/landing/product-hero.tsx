'use client';

import { useEffect, type CSSProperties } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Braces,
  Cloud,
  Code2,
  Cpu,
  Database,
  GitBranch,
  Globe,
  Layers,
  Terminal,
  Workflow,
  Zap,
} from 'lucide-react';
import { useHeroParallax } from '@/hooks/use-hero-parallax';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { CODECARD_TAGLINE } from '@/lib/marketing/positioning';

const FLOAT_ICONS = [
  { Icon: Code2, x: '15%', y: '28%', lineX: '18%', size: 30, delay: 0, duration: 9 },
  { Icon: GitBranch, x: '83%', y: '24%', lineX: '25%', size: 32, delay: 0.6, duration: 10 },
  { Icon: Terminal, x: '22%', y: '50%', lineX: '32%', size: 28, delay: 1.2, duration: 8.5 },
  { Icon: Database, x: '78%', y: '52%', lineX: '39%', size: 31, delay: 0.3, duration: 11 },
  { Icon: Cpu, x: '68%', y: '34%', lineX: '46%', size: 25, delay: 1.8, duration: 9.5 },
  { Icon: Layers, x: '31%', y: '35%', lineX: '53%', size: 24, delay: 0.9, duration: 10.5 },
  { Icon: Globe, x: '59%', y: '56%', lineX: '60%', size: 27, delay: 1.5, duration: 8 },
  { Icon: Zap, x: '49%', y: '20%', lineX: '67%', size: 22, delay: 2.1, duration: 7.5 },
  { Icon: Braces, x: '40%', y: '58%', lineX: '74%', size: 27, delay: 0.45, duration: 9.8 },
  { Icon: Cloud, x: '88%', y: '40%', lineX: '81%', size: 30, delay: 1.05, duration: 10.8 },
  { Icon: Workflow, x: '10%', y: '43%', lineX: '88%', size: 28, delay: 1.65, duration: 9.2 },
] as const;

export function ProductHero() {
  const heroRef = useHeroParallax<HTMLElement>();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const section = heroRef.current;
    if (!section) return;

    gsap.registerPlugin(ScrollTrigger);

    const statement = section.querySelector('[data-hero-statement]');
    const pitch = section.querySelector('[data-hero-pitch]');
    const cta = section.querySelector('[data-hero-cta]');
    const techIcons = gsap.utils.toArray<HTMLElement>('[data-hero-tech-icon]', section);

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

      techIcons.forEach((icon, index) => {
        const lineX = icon.dataset.lineX ?? '50%';
        gsap.to(icon, {
          keyframes: [
            {
              left: lineX,
              top: '56%',
              opacity: 0.52,
              scale: 0.94,
              duration: 0.58,
              ease: 'power2.inOut',
            },
            {
              left: lineX,
              top: '-24%',
              opacity: 0,
              scale: 0.62,
              duration: 0.42,
              ease: 'power3.in',
            },
          ],
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.9,
          },
          delay: index * 0.01,
        });
      });
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
          {FLOAT_ICONS.map(({ Icon, x, y, lineX, size, delay, duration }, i) => (
            <span
              key={i}
              className="cc-hume-hero__float-icon"
              data-hero-tech-icon
              data-line-x={lineX}
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
              <span className="cc-hume-hero__float-icon-inner">
                <Icon size={size} strokeWidth={1.55} />
              </span>
            </span>
          ))}
        </div>
      )}

      <div className="relative z-[1] flex w-full max-w-[880px] translate-y-3 flex-col items-center md:translate-y-6">
        <h1
          data-hero-statement
          className="cc-hume-hero__headline max-w-[840px] text-balance"
        >
          Your best work. Ready to{' '}
          <span className="cc-hume-gradient-text">share in seconds.</span>
        </h1>

        <p
          data-hero-pitch
          className="cc-hume-hero__tagline mt-6 max-w-[560px] text-balance"
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
