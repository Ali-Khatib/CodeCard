'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { LIVE_DEMO_PROFILE_HREF } from '@/lib/marketing/demo-url';
import { FINE_POINTER, lerp } from './hooks';
import { useIntro } from './intro';
import { Magnetic } from './magnetic';
import { Phone, ProfileScreen } from './phone';
import { useScrollTrack } from './scroll-bus';

const MAX_TILT_Y = 12;
const MAX_TILT_X = 8;

export function Cc2Hero() {
  const { ready } = useIntro();
  const rootRef = useRef<HTMLElement>(null);
  const parRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const chipARef = useRef<HTMLDivElement>(null);
  const chipBRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  // Pointer: the device tilts toward the cursor, the two chips drift at
  // different depths. One rAF loop that stops as soon as it has settled.
  useEffect(() => {
    const root = rootRef.current;
    const tilt = tiltRef.current;
    if (!root || !tilt) return;
    if (!window.matchMedia(FINE_POINTER).matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let raf = 0;

    const loop = () => {
      x = lerp(x, tx, 0.075);
      y = lerp(y, ty, 0.075);
      tilt.style.transform = `perspective(1600px) rotateY(${(x * MAX_TILT_Y).toFixed(2)}deg) rotateX(${(-y * MAX_TILT_X).toFixed(2)}deg)`;
      tilt.style.setProperty('--gx', `${(50 + x * 40).toFixed(1)}%`);
      tilt.style.setProperty('--gy', `${(30 + y * 30).toFixed(1)}%`);
      const a = chipARef.current;
      const b = chipBRef.current;
      if (a) a.style.transform = `translate3d(${(x * -26).toFixed(1)}px, ${(y * -18).toFixed(1)}px, 0)`;
      if (b) b.style.transform = `translate3d(${(x * 34).toFixed(1)}px, ${(y * 22).toFixed(1)}px, 0)`;
      if (Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    };

    const move = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      root.style.setProperty('--mx', `${e.clientX - r.left}px`);
      root.style.setProperty('--my', `${e.clientY - r.top}px`);
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const leave = () => {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    };

    root.addEventListener('pointermove', move);
    root.addEventListener('pointerleave', leave);
    return () => {
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Scroll: the device lingers while the copy leaves a little faster.
  useScrollTrack(rootRef, ({ top, height }) => {
    const y = window.scrollY - top;
    const p = Math.min(1, Math.max(0, y / height));
    if (parRef.current) {
      parRef.current.style.transform = `translate3d(0, ${(p * -9).toFixed(2)}vh, 0) scale(${(1 - p * 0.07).toFixed(4)})`;
    }
    if (copyRef.current) {
      copyRef.current.style.transform = `translate3d(0, ${(p * -6).toFixed(2)}vh, 0)`;
      copyRef.current.style.opacity = String(1 - p * 0.9);
    }
  });

  return (
    <section
      ref={rootRef}
      className="cc2-hero cc2-tone cc2-tone--ink cc2-grain"
      data-in={ready ? 'true' : 'false'}
      aria-labelledby="cc2-hero-title"
    >
      <div className="cc2-hero__spot" aria-hidden />
      <div className="cc2-wrap cc2-hero__grid">
        <div ref={copyRef} className="cc2-hero__copy">
          <h1 id="cc2-hero-title" className="cc2-display cc2-hero__title">
            <span className="cc2-line" style={{ ['--i' as string]: 0 }}>
              <span className="cc2-line__in">Share</span>
            </span>
            <span className="cc2-line" style={{ ['--i' as string]: 1 }}>
              <span className="cc2-line__in">what you</span>
            </span>
            <span className="cc2-line" style={{ ['--i' as string]: 2 }}>
              <span className="cc2-line__in">build.</span>
            </span>
          </h1>

          <p className="cc2-lede cc2-hero__lede cc2-hero__fade" style={{ ['--d' as string]: '520ms' }}>
            A profile for real-world introductions. Scan or tap, and your work opens first, in any
            browser. No app, no sign-up.
          </p>

          <div className="cc2-hero__actions cc2-hero__fade" style={{ ['--d' as string]: '640ms' }}>
            <Magnetic>
              <Link href="/sign-up" className="cc2-btn cc2-btn--signal" data-testid="hero-primary-cta">
                Create your CodeCard
                <span className="cc2-btn__arrow" aria-hidden />
              </Link>
            </Magnetic>
            <a href={LIVE_DEMO_PROFILE_HREF} className="cc2-btn cc2-btn--ghost">
              See a live card
            </a>
          </div>
        </div>

        <div className="cc2-hero__stage" aria-hidden>
          <div ref={parRef} className="cc2-hero__par">
            <div className="cc2-hero__enter">
              <div ref={tiltRef} className="cc2-hero__tilt">
                <Phone>
                  <ProfileScreen />
                </Phone>
              </div>
              <div ref={chipARef} className="cc2-chip-wrap cc2-chip-wrap--a">
                <div className="cc2-chip cc2-chip--a">
                  <span className="cc2-chip__dot" />
                  Opens in any browser
                </div>
              </div>
              <div ref={chipBRef} className="cc2-chip-wrap cc2-chip-wrap--b">
                <div className="cc2-chip cc2-chip--b">
                  <span className="cc2-chip__bar" />
                  Saved to Circle
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cc2-wrap cc2-hero__foot cc2-hero__fade" style={{ ['--d' as string]: '900ms' }}>
        <p className="cc2-meta">QR, NFC or link</p>
        <p className="cc2-meta cc2-hero__cue">
          Scroll
          <span className="cc2-hero__cueline" aria-hidden />
        </p>
      </div>
    </section>
  );
}
