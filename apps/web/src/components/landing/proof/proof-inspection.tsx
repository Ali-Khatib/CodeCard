'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import { ensureGsapPlugins, gsap } from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { useResponsiveScrollScene } from '@/hooks/use-responsive-scroll-scene';
import { useScrollTriggerRefresh } from '@/hooks/use-scroll-trigger-refresh';
import { DEMO_FEATURED_PROJECTS } from '@/lib/projects/demo-data';
import { DossierObject } from './dossier-object';
import { PROOF_INSPECTION_STATES } from './proof-content';

const QR_SIZE = 11;

function MiniQr() {
  return (
    <div
      aria-hidden
      style={{
        display: 'grid',
        gap: 2,
        width: 96,
        height: 96,
        gridTemplateColumns: `repeat(${QR_SIZE}, 1fr)`,
      }}
    >
      {Array.from({ length: QR_SIZE * QR_SIZE }).map((_, i) => {
        const row = Math.floor(i / QR_SIZE);
        const col = i % QR_SIZE;
        const on = (row * 5 + col * 3) % 7 < 3 || row < 2 || col < 2;
        return (
          <span
            key={i}
            style={{ background: on ? '#f4efe6' : 'transparent', display: 'block' }}
          />
        );
      })}
    </div>
  );
}

function InspectionPanel({ stateId }: { stateId: string }) {
  const lead = DEMO_FEATURED_PROJECTS[0]!;

  if (stateId === 'projects') {
    return (
      <div style={{ height: '100%', display: 'grid', gap: 12 }}>
        <p className="cc-proof__mono" style={{ margin: 0, color: 'var(--proof-signal)' }}>
          Featured build
        </p>
        <div style={{ position: 'relative', flex: 1, minHeight: 220, border: '1px solid rgba(244,239,230,0.16)' }}>
          {lead.posterUrl ? (
            <Image src={lead.posterUrl} alt="" fill sizes="50vw" style={{ objectFit: 'cover' }} />
          ) : null}
        </div>
        <div>
          <p className="cc-proof__display" style={{ margin: 0, fontSize: '2rem' }}>
            {lead.title}
          </p>
          <p style={{ margin: '6px 0 0', color: 'var(--proof-smoke)' }}>{lead.tagline}</p>
        </div>
      </div>
    );
  }

  if (stateId === 'research') {
    return (
      <div style={{ height: '100%', padding: '0.5rem', background: '#f4efe6', color: '#0a0a0a' }}>
        <p className="cc-proof__mono" style={{ margin: 0, color: 'var(--proof-signal)' }}>
          Paper preview
        </p>
        <p className="cc-proof__display" style={{ margin: '1rem 0 0', fontSize: '2rem', maxWidth: '14ch' }}>
          Attention under load
        </p>
        <p style={{ marginTop: 12, lineHeight: 1.5, color: '#5c564e' }}>
          Abstract, PDF, citations — next to the system that implements it. Research treated as
          first-class evidence.
        </p>
      </div>
    );
  }

  if (stateId === 'share') {
    return (
      <div style={{ height: '100%', display: 'grid', placeItems: 'center', gap: 16 }}>
        <MiniQr />
        <div style={{ textAlign: 'center' }}>
          <p className="cc-proof__mono" style={{ margin: 0, color: 'var(--proof-signal)' }}>
            Link + QR
          </p>
          <p className="cc-proof__display" style={{ margin: '8px 0 0', fontSize: '1.8rem' }}>
            codecard.app/jordan
          </p>
        </div>
      </div>
    );
  }

  if (stateId === 'analytics') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <p className="cc-proof__mono" style={{ margin: 0, color: 'var(--proof-signal)' }}>
          Engagement
        </p>
        <div>
          <p className="cc-proof__display" style={{ margin: 0, fontSize: '4rem', color: 'var(--proof-signal)' }}>
            1.2k
          </p>
          <p style={{ margin: '8px 0 0', color: 'var(--proof-smoke)' }}>views · 86 saves · 12 shares</p>
        </div>
        <svg viewBox="0 0 320 80" width="100%" height="72" aria-hidden>
          <polyline
            fill="none"
            stroke="#ff5c33"
            strokeWidth="2.5"
            points="0,70 40,58 80,62 120,40 160,46 200,22 240,28 280,12 320,18"
          />
        </svg>
      </div>
    );
  }

  return <DossierObject compact={stateId !== 'identity' && stateId !== 'complete'} />;
}

export function ProofInspection() {
  const rootRef = useRef<HTMLElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();
  const { mode, canPin } = useResponsiveScrollScene();
  const [active, setActive] = useState(0);
  useScrollTriggerRefresh({ contentKey: mode });

  useGSAP(
    () => {
      if (!canEnhanceMotion || !canPin || mode === 'reduced' || mode === 'mobile') return;
      const root = rootRef.current;
      if (!root) return;
      ensureGsapPlugins();

      const states = PROOF_INSPECTION_STATES.length;
      gsap.timeline({
        scrollTrigger: {
          id: 'proof-inspect-pin',
          trigger: root,
          start: 'top top',
          end: '+=160%',
          pin: true,
          scrub: 0.55,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.min(states - 1, Math.floor(self.progress * states));
            setActive(idx);
          },
        },
      });
    },
    { scope: rootRef, dependencies: [canEnhanceMotion, canPin, mode] },
  );

  useEffect(() => {
    if (mode === 'mobile' || mode === 'reduced') setActive(0);
  }, [mode]);

  const state = PROOF_INSPECTION_STATES[active] ?? PROOF_INSPECTION_STATES[0]!;

  return (
    <section
      ref={rootRef}
      className="cc-proof-inspect"
      id="inspect"
      data-testid="proof-inspection"
      data-scene-mode={mode}
    >
      <div className="cc-proof-inspect__pin">
        <div className="cc-proof-inspect__layout">
          <div className="cc-proof-inspect__lines">
            <p className="cc-proof__mono" style={{ margin: 0, color: 'var(--proof-signal)' }}>
              {state.kicker}
            </p>
            <h3 className="cc-proof__display">
              <span>{state.lineA}</span>
              <span>{state.lineB}</span>
            </h3>
            {mode === 'desktop' || mode === 'tablet' ? (
              <div className="cc-proof-inspect__dots" aria-hidden>
                {PROOF_INSPECTION_STATES.map((s, i) => (
                  <span
                    key={s.id}
                    className="cc-proof-inspect__dot"
                    data-active={i === active}
                  />
                ))}
              </div>
            ) : null}
            <p className="cc-proof__sans" style={{ marginTop: 18, maxWidth: '34ch', color: '#5c564e' }}>
              One object under inspection — scale and crop change; the identity stays continuous.
            </p>
          </div>

          <div className="cc-proof-inspect__viewport">
            {mode === 'mobile' || mode === 'reduced' ? (
              PROOF_INSPECTION_STATES.map((s) => (
                <div key={s.id} className="cc-proof-inspect__panel" data-active="true">
                  <p className="cc-proof__mono" style={{ margin: '0 0 10px', color: 'var(--proof-signal)' }}>
                    {s.kicker}
                  </p>
                  <InspectionPanel stateId={s.id} />
                </div>
              ))
            ) : (
              PROOF_INSPECTION_STATES.map((s, i) => (
                <div
                  key={s.id}
                  className="cc-proof-inspect__panel"
                  data-active={i === active}
                >
                  <InspectionPanel stateId={s.id} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
