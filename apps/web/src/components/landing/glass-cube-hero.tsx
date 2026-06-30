'use client';

/**
 * Volumetric purple glass cube — contained in the hero visual column.
 */
export function GlassCubeHero() {
  return (
    <div className="relative flex h-full w-full items-center justify-center" aria-hidden>
      <div
        className="cc-glass-cube pointer-events-none"
        style={{
          transform: `translateY(calc(var(--scroll-y, 0) * 32px))`,
        }}
      >
        <div className="cc-glass-cube__scene">
          <div className="cc-glass-cube__cube">
            <div className="cc-glass-cube__face cc-glass-cube__face--front" />
            <div className="cc-glass-cube__face cc-glass-cube__face--back" />
            <div className="cc-glass-cube__face cc-glass-cube__face--right" />
            <div className="cc-glass-cube__face cc-glass-cube__face--left" />
            <div className="cc-glass-cube__face cc-glass-cube__face--top" />
            <div className="cc-glass-cube__face cc-glass-cube__face--bottom" />
          </div>
          <div className="cc-glass-cube__core-glow" />
        </div>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="cc-glass-cube__particle" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}
