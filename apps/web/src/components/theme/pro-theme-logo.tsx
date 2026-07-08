/** Ornate monogram mark for the Noir Gild pro theme */
export function ProThemeLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="noir-gild-grad" x1="8" y1="6" x2="40" y2="42">
          <stop offset="0%" stopColor="#F4D58D" />
          <stop offset="45%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
      </defs>
      <path
        d="M24 4L42 14v20L24 44 6 34V14L24 4z"
        stroke="url(#noir-gild-grad)"
        strokeWidth="1.5"
        fill="rgba(212,175,55,0.08)"
      />
      <path
        d="M24 10v28M14 18h20M14 30h20M18 14l12 20M30 14L18 34"
        stroke="url(#noir-gild-grad)"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <circle cx="24" cy="24" r="3.5" fill="url(#noir-gild-grad)" />
    </svg>
  );
}
