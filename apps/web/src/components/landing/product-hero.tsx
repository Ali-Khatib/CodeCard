'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { useHeroParallax } from '@/hooks/use-hero-parallax';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { TYPE } from '@/lib/design/tokens';

const HERO_POINTS = [
  {
    tag: '01',
    line: 'Who are you?',
    detail: 'Name and role, up front.',
    icon: '◆',
  },
  {
    tag: '02',
    line: 'What have you built?',
    detail: 'Projects, demos, and outcomes first.',
    icon: '▣',
  },
  {
    tag: '03',
    line: 'One link.',
    detail: 'Share it anywhere they find you.',
    icon: '◎',
  },
] as const;

export function ProductHero() {
  const heroRef = useHeroParallax<HTMLElement>();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const section = heroRef.current;
    if (!section) return;

    const brand = section.querySelector('[data-hero-brand]');
    const headline = section.querySelector('[data-hero-headline]');
    const sub = section.querySelector('[data-hero-subcopy]');
    const items = section.querySelectorAll('[data-hero-point]');

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (brand) {
        tl.fromTo(brand, { opacity: 0, y: 28, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.85 }, 0);
      }
      if (headline) {
        tl.fromTo(headline, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.75 }, 0.1);
      }
      if (sub) {
        tl.fromTo(sub, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, 0.2);
      }
      if (items.length) {
        tl.fromTo(
          items,
          { opacity: 0, y: 28, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.12 },
          0.34,
        );
      }
    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-[92svh] scroll-mt-28 flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-[96px] text-center md:pb-28 md:pt-[104px]"
      data-testid="hero-section"
    >
      <div className="cc-hero-spotlight cc-hero-spotlight--center pointer-events-none" aria-hidden />
      <div className="cc-hero-spotlight cc-hero-spotlight--wide pointer-events-none" aria-hidden />

      <div className="relative z-[1] flex w-full max-w-[1040px] flex-col items-center">
        <p className="cc-hero-brand font-display" data-hero-brand aria-label="CodeCard">
          CodeCard
        </p>

        <h1
          data-hero-headline
          className={`mt-6 ${TYPE.heroHeading} text-balance text-vellum`}
        >
          Share what you{' '}
          <span className="bg-gradient-to-r from-reactor-bright via-reactor to-lavender-mist bg-clip-text text-transparent">
            build.
          </span>
        </h1>

        <p
          data-hero-subcopy
          className="cc-hero-subcopy mt-10 max-w-[700px] font-sans text-[18px] font-normal leading-[1.5] text-ash md:mt-12 md:text-[21px] md:leading-[1.45]"
        >
          If you build things, CodeCard is the one link you need. Your work goes first. Résumé,
          school, and companies still matter. They just do not open the story.{' '}
          <span className="text-vellum">Your work becomes the conversation starter.</span>
        </p>

        <ul className="cc-hero-points mt-14 w-full max-w-[960px]">
          {HERO_POINTS.map((point) => (
            <li key={point.tag} className="cc-hero-points__item" data-hero-point>
              <div className="cc-hero-points__top">
                <span className="cc-hero-points__icon" aria-hidden>
                  {point.icon}
                </span>
                <span className="cc-hero-points__index font-eyebrow">{point.tag}</span>
              </div>
              <p className="cc-hero-points__line font-display">{point.line}</p>
              <p className="cc-hero-points__detail font-sans">{point.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
