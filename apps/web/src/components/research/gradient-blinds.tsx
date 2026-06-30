'use client';

interface GradientBlindsProps {
  className?: string;
  intensity?: number;
}

/** Violet / lavender / black gradient blinds only */
export function GradientBlinds({ className = '', intensity = 1 }: GradientBlindsProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
      style={{ opacity: intensity }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            repeating-linear-gradient(
              90deg,
              #000000 0px,
              #000000 24px,
              rgba(124, 58, 237, 0.06) 24px,
              rgba(196, 167, 255, 0.12) 28px,
              rgba(76, 29, 149, 0.08) 32px,
              #000000 36px
            )
          `,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_65%_45%,rgba(124,58,237,0.16),transparent_65%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#000000] via-transparent to-[#0f0217]" />
    </div>
  );
}
