'use client';

import { useState, type ReactNode } from 'react';
import { Briefcase, GraduationCap, MapPin, Sparkles } from 'lucide-react';
import { FlipCard } from '@/components/ui/flip-card';
import { cn } from '@/lib/utils';
import type { ProfileHistoryLine } from '@/lib/profile/quick-history';

const ICONS = [Sparkles, Briefcase, GraduationCap, MapPin];

/**
 * Public identity panel with a 3D flip. Front is the live profile;
 * back is a short history. Copy / QR stay on the charcoal card, below the flip.
 *
 * Flip is button-only — hover used to steal clicks from the social row on the front.
 */
export function PublicHeroFlipPanel({
  children,
  footer,
  history,
  displayName,
  className,
}: {
  children: ReactNode;
  footer?: ReactNode;
  history: ProfileHistoryLine[];
  displayName: string;
  className?: string;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={cn('cc-public-hero__panel cc-public-hero__flip min-w-0', className)}
      data-flipped={flipped ? 'true' : 'false'}
    >
      <FlipCard
        className="cc-public-hero__flip-scene"
        hint="Spin"
        hintWhenFlipped="Spin"
        flipped={flipped}
        onFlippedChange={setFlipped}
        flipOnHover={false}
        flipOnClick={false}
        front={<div className="cc-public-hero__face">{children}</div>}
        back={
          <div className="cc-public-hero__face cc-public-hero__face--back">
            <p className="cc-app-mono cc-public-hero__eyebrow">Quick history</p>
            <p className="cc-public-hero__title mt-2 text-[1.35rem] font-medium tracking-[-0.03em]">
              {displayName}
            </p>
            <ul className="cc-public-hero__history">
              {history.map((line, index) => {
                const Icon = ICONS[index % ICONS.length];
                return (
                  <li key={line.label} className="cc-public-hero__history-item">
                    <span className="cc-public-hero__history-icon" aria-hidden>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="cc-app-mono cc-public-hero__history-label">
                        {line.label}
                      </span>
                      <span className="cc-public-hero__history-value">{line.value}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        }
      />
      {footer ? <div className="cc-public-hero__flip-footer">{footer}</div> : null}
    </div>
  );
}
