'use client';

import { useRef } from 'react';
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

/** Scattered start offsets (percent of stage) → converge to card center. */
const FRAGMENT_LAYOUT = [
  { x: -38, y: -28, z: 0 },
  { x: 36, y: -32, z: 0 },
  { x: -42, y: 8, z: 0 },
  { x: 40, y: 4, z: 0 },
  { x: -28, y: 34, z: 0 },
  { x: 30, y: 36, z: 0 },
  { x: -8, y: -40, z: 0 },
  { x: 6, y: 42, z: 0 },
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
        const depthScale = window.matchMedia('(min-width: 1024px)').matches ? 1 : 0.72;

        chips.forEach((chip, i) => {
          const layout = FRAGMENT_LAYOUT[i % FRAGMENT_LAYOUT.length]!;
          gsap.set(chip, {
            xPercent: layout.x * depthScale,
            yPercent: layout.y * depthScale,
            opacity: 0,
            scale: 0.92,
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
            start: 'top top',
            end: `+=${pinVh}%`,
            pin: true,
            scrub: 0.65,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            markers: gsapMarkersEnabled(),
          },
        });

        if (intro) {
          tl.to(intro, { opacity: 0.35, duration: 0.2 }, 0);
        }

        chips.forEach((chip, i) => {
          tl.to(
            chip,
            {
              opacity: 1,
              scale: 1,
              duration: 0.18,
            },
            0.08 + i * 0.04,
          );
        });

        chips.forEach((chip, i) => {
          const layout = FRAGMENT_LAYOUT[i % FRAGMENT_LAYOUT.length]!;
          tl.to(
            chip,
            {
              xPercent: layout.x * 0.55 * depthScale,
              yPercent: layout.y * 0.55 * depthScale,
              duration: 0.28,
            },
            0.42,
          );
        });

        tl.to(
          chips,
          {
            xPercent: 0,
            yPercent: 0,
            opacity: 0,
            scale: 0.86,
            duration: 0.4,
            stagger: 0.02,
          },
          0.72,
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
          0.9,
        );

        tl.fromTo(
          card.querySelector('.cc-cinematic-card__sweep'),
          { xPercent: -120, opacity: 0 },
          { xPercent: 120, opacity: 1, duration: 0.45, ease: MOTION_EASE.soft },
          1.05,
        );

        // Hold completed state before unpin
        tl.to({}, { duration: 0.22 });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      mm.add('(max-width: 767px)', () => {
        chips.forEach((chip) => {
          gsap.set(chip, { clearProps: 'transform,opacity' });
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
        <div data-cinematic-intro className="cc-cinematic-scattered__intro">
          <p className="cc-cinematic-eyebrow">The problem</p>
          <h2 className="cc-cinematic-heading">
            Technical work is scattered across too many places.
          </h2>
          <p className="cc-cinematic-body">
            GitHub, projects, research papers, resumes, LinkedIn, analytics, QR sharing, and
            documents — each valuable alone, hard to present as one professional identity.
          </p>
        </div>

        <div
          className="cc-cinematic-scattered__stage"
          data-cinematic-stage
          aria-hidden={mode !== 'reduced' ? true : undefined}
        >
          <div className="cc-cinematic-scattered__orbit" aria-hidden>
            {fragments.map((frag) => (
              <div
                key={frag.id}
                className="cc-cinematic-scattered__chip-wrap"
                data-cinematic-chip
                data-fragment={frag.id}
              >
                <FragmentChip label={frag.label} kind={frag.kind} />
              </div>
            ))}
          </div>

          <div className="cc-cinematic-scattered__card-wrap" data-cinematic-card>
            <UnifiedCodeCardPreview sweep />
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
                  <FragmentChip label={frag.label} kind={frag.kind} />
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
