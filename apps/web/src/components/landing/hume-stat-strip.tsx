'use client';

import { ScrollSequence } from './scroll-sequence';

const STATS = [
  { value: '<5 min', label: 'to publish your CodeCard' },
  { value: '1 link', label: 'share by QR or screen' },
  { value: '3×', label: 'more opens with hero video' },
] as const;

export function HumeStatStrip() {
  return (
    <section className="cc-hume-stat-sequence border-y border-[var(--border)] bg-paper" aria-label="Key metrics">
      <div className="cc-container">
        <ScrollSequence
          items={STATS}
          stepVh={48}
          className="cc-hume-stat-sequence__runway"
          stageClassName="cc-hume-stat-sequence__stage"
          renderItem={(stat, _i, isActive) => (
            <div className="cc-hume-stat-sequence__card" data-active={isActive}>
              <p className="cc-hume-stat-sequence__value">{stat.value}</p>
              <p className="cc-hume-stat-sequence__label">{stat.label}</p>
            </div>
          )}
        />
      </div>
    </section>
  );
}
