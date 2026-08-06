'use client';

import { useCallback, useRef, type CSSProperties, type MouseEvent } from 'react';
import { PROOF_PERSONA } from './proof-content';

type DossierObjectProps = {
  className?: string;
  scan?: boolean;
  compact?: boolean;
};

export function DossierObject({ className = '', scan = false, compact = false }: DossierObjectProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const onMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!scan) return;
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--scan-x', `${x}%`);
      el.style.setProperty('--scan-y', `${y}%`);
    },
    [scan],
  );

  return (
    <div
      ref={rootRef}
      className={`cc-proof-dossier ${className}`.trim()}
      onMouseMove={onMove}
      data-compact={compact || undefined}
    >
      {scan ? <div className="cc-proof-dossier__scan" aria-hidden /> : null}

      <div className="cc-proof-dossier__meta cc-proof__mono">
        <span className="cc-proof-dossier__mark">{PROOF_PERSONA.verified}</span>
        <span>{PROOF_PERSONA.id}</span>
      </div>

      <div className="cc-proof-dossier__avatar" aria-hidden />

      <p className="cc-proof-dossier__name">{PROOF_PERSONA.name}</p>
      <p className="cc-proof-dossier__role">
        {PROOF_PERSONA.role} · {PROOF_PERSONA.location}
      </p>
      {!compact ? <p className="cc-proof-dossier__bio">{PROOF_PERSONA.bio}</p> : null}

      <div className="cc-proof-dossier__chips" aria-hidden>
        <span>Projects</span>
        <span>Research</span>
        <span>Share</span>
        <span>Analytics</span>
      </div>

      <div className="cc-proof-dossier__rule" aria-hidden />

      <div className="cc-proof-dossier__footer cc-proof__mono">
        <span>codecard.app / jordan</span>
        <span style={{ color: 'var(--proof-signal)' } as CSSProperties}>LIVE</span>
      </div>
    </div>
  );
}
