'use client';

import { useRef } from 'react';
import { useInViewOnce } from './hooks';
import { Phone, ProfileScreen, SavedScreen, TapScreen } from './phone';
import { useScrollTrack } from './scroll-bus';

const STEPS = [
  {
    title: 'Tap or scan',
    body: 'A QR code, an NFC card or a link, whichever is closest. Nothing to install on their side.',
  },
  {
    title: 'Your work opens first',
    body: 'In about a second they see who you are and what you built, strongest project first. No account, no clutter.',
  },
  {
    title: 'Keep the connection',
    body: 'Save them with when and where you met, a private note and a follow-up date. It stays with you.',
  },
] as const;

/**
 * Three steps, one device. Pinned on desktop: scroll moves the device through
 * its three screens and tilts it toward the step being described.
 * On small screens the steps simply stack, each with its own screen.
 */
export function Cc2Journey() {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const step = useRef(-1);
  const [headRef, headSeen] = useInViewOnce<HTMLDivElement>(0.4);

  useScrollTrack(rootRef, ({ pin }) => {
    const pinEl = pinRef.current;
    if (!pinEl) return;
    const next = pin < 0.34 ? 0 : pin < 0.68 ? 1 : 2;
    if (next !== step.current) {
      step.current = next;
      pinEl.dataset.step = String(next);
    }
    if (fillRef.current) fillRef.current.style.transform = `scaleY(${pin.toFixed(3)})`;
  });

  return (
    <section
      ref={rootRef}
      id="journey"
      className="cc2-journey cc2-tone cc2-tone--ink"
      aria-labelledby="cc2-journey-title"
    >
      <div ref={pinRef} className="cc2-journey__pin" data-step="0">
        <div className="cc2-wrap cc2-journey__grid">
          <div className="cc2-journey__copy">
            <div ref={headRef} data-in={headSeen ? 'true' : 'false'}>
              <h2 id="cc2-journey-title" className="cc2-h2">
                <span className="cc2-line" style={{ ['--i' as string]: 0 }}>
                  <span className="cc2-line__in">An introduction,</span>
                </span>
                <span className="cc2-line" style={{ ['--i' as string]: 1 }}>
                  <span className="cc2-line__in">start to finish.</span>
                </span>
              </h2>
            </div>

            <div className="cc2-journey__steps">
              <span className="cc2-journey__rail" aria-hidden>
                <span ref={fillRef} className="cc2-journey__railfill" />
              </span>
              <ol>
                {STEPS.map((s, i) => (
                  <li key={s.title} className="cc2-step" data-i={i}>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                    <div className="cc2-step__inline" aria-hidden>
                      <Phone>{i === 0 ? <TapScreen /> : i === 1 ? <ProfileScreen /> : <SavedScreen />}</Phone>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="cc2-journey__stage" aria-hidden>
            <div className="cc2-journey__device">
              <Phone>
                <div className="cc2-journey__screens">
                  <div className="cc2-journey__screen" data-for="0">
                    <TapScreen />
                  </div>
                  <div className="cc2-journey__screen" data-for="1">
                    <ProfileScreen />
                  </div>
                  <div className="cc2-journey__screen" data-for="2">
                    <SavedScreen />
                  </div>
                </div>
              </Phone>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
