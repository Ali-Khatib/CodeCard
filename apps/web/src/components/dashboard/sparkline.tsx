'use client';

export function Sparkline({
  points,
  className = '',
}: {
  points: number[];
  className?: string;
}) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const w = 120;
  const h = 36;
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      className={className}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polygon
        fill="var(--app-iris)"
        fillOpacity="0.12"
        points={`0,${h} ${coords} ${w},${h}`}
      />
      <polyline
        points={coords}
        fill="none"
        stroke="var(--app-iris)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
