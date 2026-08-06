'use client';

type CinematicProgressProps = {
  stages: readonly string[];
  activeIndex: number;
  className?: string;
};

/** Static progress dots — active index is driven by GSAP via data attributes, not React scroll. */
export function CinematicProgress({
  stages,
  activeIndex,
  className = '',
}: CinematicProgressProps) {
  const safeIndex = Math.max(0, Math.min(activeIndex, stages.length - 1));

  return (
    <div
      className={`cc-cinematic-progress ${className}`.trim()}
      role="group"
      aria-label={`Feature stage ${safeIndex + 1} of ${stages.length}: ${stages[safeIndex]}`}
      data-testid="cinematic-progress"
      data-active-index={safeIndex}
    >
      {stages.map((label, index) => {
        const active = index === safeIndex;
        const done = index < safeIndex;
        return (
          <span
            key={label}
            className="cc-cinematic-progress__dot"
            data-active={active || undefined}
            data-done={done || undefined}
            title={label}
            aria-hidden
          />
        );
      })}
      <span className="cc-cinematic-progress__label" aria-hidden>
        {stages[safeIndex]}
      </span>
    </div>
  );
}
