'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { ensureGsapPlugins, gsap, refreshScrollTrigger } from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { EditorialImage } from './ls-photo';
import { SLOTS } from './ls-slots';

/**
 * The hero transformation.
 *
 * One pinned section, one scroll progress value, four timelines reading from
 * it: the frame, the headline, the mosaic and the chrome. Everything is
 * clip-path, transform and opacity, so nothing reflows and the whole thing
 * scrubs backwards as cleanly as it runs forwards.
 *
 * The sequence, as a reader experiences it:
 *   0.00  full-bleed photograph, transparent chrome, the headline split to
 *         the two edges of the screen, the wordmark large and centred
 *   0.35  the frame has contracted to a centred cinematic crop, the page
 *         behind it has turned from ink to white, the headline has slid out
 *         past the frame's edges, the wordmark has travelled up into the bar
 *   0.65  four more photographs have entered from the sides and settled into
 *         an asymmetric mosaic at different depths
 *   1.00  the oversized wordline has risen behind the photographs and the
 *         bar is a floating translucent pill carrying only the symbol
 *
 * The CSS variable --ls-progress is published on the root so the navigation
 * and the page background can read the same number instead of running their
 * own triggers against the same scroll range.
 */

const MOSAIC = [
  { slot: SLOTS.mosaicA, cls: 'a', from: -1, depth: 0.78 },
  { slot: SLOTS.mosaicB, cls: 'b', from: -1, depth: 0.92 },
  { slot: SLOTS.mosaicC, cls: 'c', from: 1, depth: 0.84 },
  { slot: SLOTS.mosaicD, cls: 'd', from: 1, depth: 1 },
] as const;

export function LsHero({
  lineOne,
  lineTwo,
  wordline,
}: {
  lineOne: string;
  lineTwo: string;
  wordline: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;

      /* Reduced motion gets the destination, composed and static: the frame
         already contracted, the mosaic already settled, the chrome already
         light. Nothing moves and nothing is missing. */
      if (!canEnhanceMotion) {
        el.dataset.lsState = 'settled';
        document.documentElement.style.setProperty('--ls-progress', '1');
        return;
      }

      ensureGsapPlugins();
      el.dataset.lsState = 'live';

      const frame = el.querySelector<HTMLElement>('.ls-hero__frame');
      const halves = Array.from(el.querySelectorAll<HTMLElement>('.ls-hero__half'));
      const tiles = Array.from(el.querySelectorAll<HTMLElement>('.ls-hero__tile'));
      const giant = el.querySelector<HTMLElement>('.ls-hero__wordline');
      const cue = el.querySelector<HTMLElement>('.ls-hero__cue');
      const small = window.matchMedia('(max-width: 860px)').matches;

      /* Resting state: full bleed inside the page's own 8px margin. */
      gsap.set(frame, { clipPath: 'inset(0px round 12px)' });
      gsap.set(tiles, { opacity: 0 });
      gsap.set(giant, { opacity: 0, yPercent: 26 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          onUpdate: (self) => {
            const p = self.progress;
            document.documentElement.style.setProperty('--ls-progress', p.toFixed(4));
            const phase = p < 0.3 ? 'open' : p < 0.62 ? 'contracting' : 'settled';
            if (el.dataset.lsPhase !== phase) el.dataset.lsPhase = phase;
          },
        },
      });

      /* 1 — the world contracts. */
      const inset = small ? 'inset(16% 5% 16% 5% round 16px)' : 'inset(9% 23% 9% 23% round 16px)';
      tl.to(frame, { clipPath: inset, duration: 0.36 }, 0);

      /* 2 — the headline leaves through the sides it already sits against. */
      tl.to(halves[0] ?? {}, { xPercent: -34, opacity: 0, duration: 0.3 }, 0.02);
      tl.to(halves[1] ?? {}, { xPercent: 34, opacity: 0, duration: 0.3 }, 0.02);
      tl.to(cue, { opacity: 0, duration: 0.12 }, 0);

      /* 3 — the rest of the photography arrives from the edges. */
      tiles.forEach((tile, i) => {
        const conf = MOSAIC[i];
        if (!conf) return;
        tl.fromTo(
          tile,
          { xPercent: conf.from * (small ? 60 : 120), opacity: 0, scale: 0.94 },
          { xPercent: 0, opacity: 1, scale: 1, duration: 0.3 },
          0.3 + i * 0.045,
        );
        /* Different depths drift at different rates, so the mosaic has air. */
        tl.to(tile, { yPercent: -7 * conf.depth, duration: 0.34 }, 0.62);
      });

      /* 4 — the wordline rises behind everything. */
      tl.to(giant, { opacity: 1, yPercent: 0, duration: 0.26 }, 0.56);
      tl.to(giant, { yPercent: -9, duration: 0.18 }, 0.82);

      refreshScrollTrigger({ safe: true });

      return () => {
        document.documentElement.style.removeProperty('--ls-progress');
      };
    },
    { scope: root, dependencies: [canEnhanceMotion] },
  );

  return (
    <section ref={root} className="ls-hero" aria-label="CodeCard">
      <div className="ls-hero__pin">
        <p className="ls-hero__wordline" aria-hidden>
          {wordline}
        </p>

        <div className="ls-hero__frame">
          <EditorialImage slot={SLOTS.heroPrimary} sizes="100vw" priority />
        </div>

        <h1 className="ls-hero__title">
          <span className="ls-hero__half ls-hero__half--l">{lineOne}</span>
          <span className="ls-hero__half ls-hero__half--r">{lineTwo}</span>
        </h1>

        <div className="ls-hero__mosaic" aria-hidden>
          {MOSAIC.map(({ slot, cls }) => (
            <figure key={cls} className={`ls-hero__tile ls-hero__tile--${cls}`}>
              <EditorialImage slot={slot} sizes="(max-width: 860px) 46vw, 26vw" />
            </figure>
          ))}
        </div>

        <p className="ls-hero__cue" aria-hidden>
          Scroll to explore
        </p>
      </div>
    </section>
  );
}
