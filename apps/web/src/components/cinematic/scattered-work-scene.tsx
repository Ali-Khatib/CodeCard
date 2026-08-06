'use client';

import { useRef, type CSSProperties } from 'react';
import { useGSAP } from '@gsap/react';
import {
  ensureGsapPlugins,
  gsap,
  gsapMarkersEnabled,
} from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { MOTION_EASE } from '@/components/motion/motion-tokens';
import { useResponsiveScrollScene } from '@/hooks/use-responsive-scroll-scene';
import { useScrollTriggerRefresh } from '@/hooks/use-scroll-trigger-refresh';
import {
  FragmentChip,
  SCATTERED_FRAGMENTS,
  UnifiedCodeCardPreview,
} from './cinematic-previews';

/** Desktop/tablet pin distance in vh — within 150–190vh brief. */
const PIN_VH = { desktop: 170, tablet: 130 } as const;
const PIN_START = 'top 88px'; // clear sticky marketing nav

/**
 * Stage-relative positions (% of orbit box).
 * Overlapping constellation that fills the stage — readable, not a sparse ring.
 */
const FRAGMENT_LAYOUT = [
  { left: 24, top: 18, rotate: -7 },
  { left: 74, top: 16, rotate: 6 },
  { left: 14, top: 46, rotate: -5 },
  { left: 82, top: 48, rotate: 7 },
  { left: 28, top: 74, rotate: 4 },
  { left: 70, top: 76, rotate: -6 },
  { left: 48, top: 12, rotate: -3 },
  { left: 50, top: 82, rotate: 3 },
] as const;

/**
 * Scene One — Scattered technical work → unified CodeCard.
 * One pinned ScrollTrigger timeline on desktop/tablet; progressive stack on mobile;
 * static narrative under reduced motion.
 */
export function ScatteredWorkScene() {
  const rootRef = useRef<HTMLElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();
  const { mode, canPin } = useResponsiveScrollScene();
  useScrollTriggerRefresh({ contentKey: mode });

  const fragmentCount =
    mode === 'tablet' ? 6 : mode === 'mobile' || mode === 'reduced' ? 8 : 8;
  const fragments = SCATTERED_FRAGMENTS.slice(0, fragmentCount);

  useGSAP(
    () => {
      if (!canEnhanceMotion || mode === 'reduced') return;
      const root = rootRef.current;
      if (!root) return;

      ensureGsapPlugins();
      const stage = root.querySelector<HTMLElement>('[data-cinematic-stage]');
      const intro = root.querySelector<HTMLElement>('[data-cinematic-intro]');
      const card = root.querySelector<HTMLElement>('[data-cinematic-card]');
      const chips = gsap.utils.toArray<HTMLElement>('[data-cinematic-chip]', root);
      if (!stage || !card || chips.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px)', () => {
        const pinVh = window.matchMedia('(min-width: 1024px)').matches
          ? PIN_VH.desktop
          : PIN_VH.tablet;
        const depthScale = window.matchMedia('(min-width: 1024px)').matches ? 1 : 0.88;

        chips.forEach((chip, i) => {
          const layout = FRAGMENT_LAYOUT[i % FRAGMENT_LAYOUT.length]!;
          gsap.set(chip, {
            left: `${layout.left}%`,
            top: `${layout.top}%`,
            xPercent: -50,
            yPercent: -50,
            rotation: layout.rotate * depthScale,
            opacity: 1,
            scale: 1,
            force3D: true,
          });
        });
        gsap.set(card, { opacity: 0, scale: 0.94, force3D: true });
        if (intro) gsap.set(intro, { opacity: 1 });

        const tl = gsap.timeline({
          defaults: { ease: MOTION_EASE.inOut },
          scrollTrigger: {
            id: 'cinematic-scattered-pin',
            trigger: root,
            start: PIN_START,
            end: `+=${pinVh}%`,
            pin: true,
            scrub: 0.65,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            markers: gsapMarkersEnabled(),
          },
        });

        // Brief hold on the readable scattered state
        tl.to({}, { duration: 0.18 });

        if (intro) {
          tl.to(intro, { opacity: 0.42, duration: 0.22 }, 0.12);
        }

        // Pull slightly inward so the “scattered → assembling” beat is readable
        chips.forEach((chip, i) => {
          const layout = FRAGMENT_LAYOUT[i % FRAGMENT_LAYOUT.length]!;
          const midLeft = 50 + (layout.left - 50) * 0.55;
          const midTop = 50 + (layout.top - 50) * 0.55;
          tl.to(
            chip,
            {
              left: `${midLeft}%`,
              top: `${midTop}%`,
              rotation: layout.rotate * 0.3,
              duration: 0.32,
            },
            0.28,
          );
        });

        tl.to(
          chips,
          {
            left: '50%',
            top: '50%',
            opacity: 0,
            scale: 0.7,
            rotation: 0,
            duration: 0.42,
            stagger: 0.025,
          },
          0.62,
        );

        tl.to(
          card,
          {
            opacity: 1,
            scale: 1,
            duration: 0.35,
            onStart: () => {
              card.querySelector('.cc-cinematic-card')?.setAttribute('data-sweep', 'true');
            },
          },
          0.82,
        );

        tl.fromTo(
          card.querySelector('.cc-cinematic-card__sweep'),
          { xPercent: -120, opacity: 0 },
          { xPercent: 120, opacity: 1, duration: 0.45, ease: MOTION_EASE.soft },
          0.98,
        );

        // Hold completed state before unpin
        tl.to({}, { duration: 0.24 });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      mm.add('(max-width: 767px)', () => {
        chips.forEach((chip) => {
          gsap.set(chip, { clearProps: 'transform,opacity,left,top,rotation' });
        });
        gsap.set(card, { clearProps: 'transform,opacity' });

        const tl = gsap.timeline({
          scrollTrigger: {
            id: 'cinematic-scattered-mobile',
            trigger: root,
            start: 'top 75%',
            end: 'bottom 55%',
            scrub: 0.5,
            invalidateOnRefresh: true,
            markers: gsapMarkersEnabled(),
          },
        });

        chips.forEach((chip, i) => {
          gsap.set(chip, { opacity: 0.35, y: 18 });
          tl.to(chip, { opacity: 1, y: 0, duration: 0.2 }, i * 0.05);
        });
        gsap.set(card, { opacity: 0.4, y: 24 });
        tl.to(card, { opacity: 1, y: 0, duration: 0.35 }, 0.35);

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      return () => mm.revert();
    },
    {
      scope: rootRef,
      dependencies: [canEnhanceMotion, mode, canPin, fragmentCount],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      ref={rootRef}
      id="scattered-work"
      className="cc-cinematic-scattered scroll-mt-28"
      data-testid="cinematic-scattered-scene"
      data-scene-mode={mode}
      data-motion-pattern="section-enter"
      data-motion-owner="gsap"
      data-cinematic-runtime="landing"
    >
      <div className="cc-container cc-cinematic-scattered__inner">
        <div className="cc-cinematic-scattered__layout">
          <div data-cinematic-intro className="cc-cinematic-scattered__intro">
            <p className="cc-cinematic-eyebrow">The problem</p>
            <h2 className="cc-cinematic-heading">
              Technical work is scattered across too many places.
            </h2>
            <p className="cc-cinematic-body">
              GitHub, projects, research papers, resumes, LinkedIn, analytics, QR sharing, and
              documents — each valuable alone, hard to present as one professional identity.
            </p>
            <p className="cc-cinematic-scattered__cue" aria-hidden={mode === 'reduced'}>
              Scroll — watch them assemble into one CodeCard.
            </p>
          </div>

          <div
            className="cc-cinematic-scattered__stage"
            data-cinematic-stage
            aria-hidden={mode !== 'reduced' ? true : undefined}
          >
            <div className="cc-cinematic-scattered__orbit" aria-hidden>
              {fragments.map((frag, index) => {
                const layout = FRAGMENT_LAYOUT[index % FRAGMENT_LAYOUT.length]!;
                return (
                  <div
                    key={frag.id}
                    className="cc-cinematic-scattered__chip-wrap"
                    data-cinematic-chip
                    data-fragment={frag.id}
                    style={
                      {
                        '--chip-left': `${layout.left}%`,
                        '--chip-top': `${layout.top}%`,
                        '--chip-rotate': `${layout.rotate}deg`,
                      } as CSSProperties
                    }
                  >
                    <FragmentChip label={frag.label} hint={frag.hint} kind={frag.kind} />
                  </div>
                );
              })}
            </div>

            <div className="cc-cinematic-scattered__card-wrap" data-cinematic-card>
              <UnifiedCodeCardPreview sweep />
            </div>
          </div>
        </div>

        {/* Always in document order for a11y / no-JS — decorative stage above is aria-hidden when animated */}
        <div className="cc-cinematic-scattered__sr">
          <p>
            CodeCard unifies those fragments into one living profile visitors can open from a link
            or QR code.
          </p>
        </div>

        {mode === 'reduced' ? (
          <div className="cc-cinematic-scattered__static" data-testid="cinematic-scattered-static">
            <ul className="cc-cinematic-scattered__list">
              {fragments.map((frag) => (
                <li key={frag.id}>
                  <FragmentChip label={frag.label} hint={frag.hint} kind={frag.kind} />
                </li>
              ))}
            </ul>
            <p className="cc-cinematic-body mt-8">
              Then they assemble into one CodeCard — projects, research, sharing, and proof in a
              single place.
            </p>
            <div className="mt-8 flex justify-center">
              <UnifiedCodeCardPreview />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
