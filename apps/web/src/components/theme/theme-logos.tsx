/** Punk / riot pro mark */
export function PunkThemeLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path
        d="M24 6L8 14v14l16 14 16-14V14L24 6z"
        stroke="currentColor"
        strokeWidth="2"
        className="text-reactor"
      />
      <path
        d="M18 22h12M24 16v16M16 28l8-8 8 8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="text-reactor-bright"
      />
    </svg>
  );
}

/** Cyberpunk grid + bolt mark */
export function CyberThemeLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="cyber-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#FF00C8" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="36" height="36" rx="4" stroke="url(#cyber-grad)" strokeWidth="1.5" />
      <path d="M6 18h36M6 30h36M18 6v36M30 6v36" stroke="url(#cyber-grad)" strokeWidth="0.75" opacity="0.5" />
      <path
        d="M22 14l10 10-10 10V14z"
        fill="url(#cyber-grad)"
        opacity="0.9"
      />
    </svg>
  );
}
