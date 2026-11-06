'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import { ensureGsapPlugins, gsap, refreshScrollTrigger } from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { ShaderHeroBackdrop } from '@/components/ui/shader-hero';

/**
 * CodeCard's own hero field, framed.
 *
 * It starts as a contained composition with page visible around it and opens to
 * full bleed as you scroll, with the headline filling in word by word. The whole
 * move is clip-path and opacity, so nothing reflows and nothing shifts.
 * `expand={false}` renders the same composition already open, for inner pages.
 */
export function StoryHero({
  words,
  sub,
  actions,
  expand = true,
}: {
  words: readonly string[];
  sub: string;
  actions: ReactNode;
  expand?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();

  useGSAP(
    () => {
      const el = root.current;
      if (!el || !canEnhanceMotion || !expand) return;
      ensureGsapPlugins();

      const canvas = el.querySelector<HTMLElement>('.pl-hero__canvas');
      const parts = Array.from(el.querySelectorAll<HTMLElement>('.pl-hero__w'));
      const small = window.matchMedia('(max-width: 760px)').matches;
      /* The top inset clears the bar, so the bar sits on paper while the hero
         is contained and only turns light once the canvas reaches it. */
      const top = small ? 78 : 88;
      const padB = small ? '2%' : '3.4%';
      const padX = small ? '3%' : '4.2%';
      const radius = small ? 16 : 20;

      if (canvas) {
        gsap.set(canvas, { clipPath: `inset(${top}px ${padX} ${padB} ${padX} round ${radius}px)` });
      }
      el.dataset.open = 'false';
      gsap.set(parts, { opacity: 0.24 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.4,
          onUpdate: (self) => {
            const open = self.progress > 0.34 ? 'true' : 'false';
            if (el.dataset.open !== open) {
              el.dataset.open = open;
              window.dispatchEvent(new Event('pl:tone'));
            }
          },
        },
      });
      if (canvas) tl.to(canvas, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 0.5 }, 0);
      tl.fromTo('.pl-hero__inner', { scale: 0.962 }, { scale: 1, duration: 0.5 }, 0);
      tl.to(parts, { opacity: 1, stagger: 0.06, duration: 0.14 }, 0.07);
      tl.to('.pl-hero__cue', { opacity: 0, duration: 0.1 }, 0);

      refreshScrollTrigger({ safe: true });
    },
    { scope: root, dependencies: [canEnhanceMotion, expand] },
  );

  return (
    <section ref={root} className="pl-hero" data-expand={expand ? 'true' : 'false'} data-band="dark">
      <div className="pl-hero__stage">
        <div className="pl-hero__canvas" aria-hidden>
          <ShaderHeroBackdrop />
          <div className="pl-hero__shade" />
        </div>
        <div className="pl-hero__inner">
          <h1 className="pl-display pl-hero__title">
            {words.map((w, i) => (
              <span key={`${w}-${i}`} className="pl-hero__w">
                {w}{' '}
              </span>
            ))}
          </h1>
          <p className="pl-hero__sub">{sub}</p>
          <div className="pl-hero__cta">{actions}</div>
        </div>
        {expand ? (
          <p className="pl-hero__cue" aria-hidden>
            Scroll
          </p>
        ) : null}
      </div>
    </section>
  );
}
