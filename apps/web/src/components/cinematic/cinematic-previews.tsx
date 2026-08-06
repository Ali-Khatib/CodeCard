/** Lightweight CodeCard-shaped preview used by landing cinematic scenes (no workspace imports). */

export const SCATTERED_FRAGMENTS = [
  {
    id: 'github',
    label: 'GitHub',
    hint: 'Repos & history',
    kind: 'code',
  },
  {
    id: 'projects',
    label: 'Projects',
    hint: 'Demos & case studies',
    kind: 'work',
  },
  {
    id: 'research',
    label: 'Research',
    hint: 'Papers & PDFs',
    kind: 'paper',
  },
  {
    id: 'resume',
    label: 'Resume',
    hint: 'Credentials only',
    kind: 'doc',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    hint: 'Career timeline',
    kind: 'network',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    hint: 'Views & saves',
    kind: 'chart',
  },
  {
    id: 'qr',
    label: 'QR share',
    hint: 'In-person handoff',
    kind: 'qr',
  },
  {
    id: 'docs',
    label: 'Documents',
    hint: 'Scattered files',
    kind: 'folder',
  },
] as const;

export type ScatteredFragmentId = (typeof SCATTERED_FRAGMENTS)[number]['id'];

function FragmentIcon({ kind }: { kind: (typeof SCATTERED_FRAGMENTS)[number]['kind'] }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (kind) {
    case 'code':
      return (
        <svg {...common}>
          <path d="M8 7 3 12l5 5M16 7l5 5-5 5M14 4l-4 16" />
        </svg>
      );
    case 'work':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case 'paper':
      return (
        <svg {...common}>
          <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M9 13h6M9 17h4" />
        </svg>
      );
    case 'doc':
      return (
        <svg {...common}>
          <path d="M8 3h6l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          <path d="M14 3v5h5M9 13h6M9 17h3" />
        </svg>
      );
    case 'network':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="2.5" />
          <circle cx="16" cy="8" r="2.5" />
          <circle cx="12" cy="16" r="2.5" />
          <path d="M10 9.2 14 9.2M9.2 10.2 11 14M14.8 10.2 13 14" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...common}>
          <path d="M4 19V5M4 19h16" />
          <path d="M8 16v-5M12 16V8M16 16v-3" />
        </svg>
      );
    case 'qr':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3M20 14v6M14 20h3" />
        </svg>
      );
    case 'folder':
      return (
        <svg {...common}>
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

export function UnifiedCodeCardPreview({
  className = '',
  sweep = false,
}: {
  className?: string;
  sweep?: boolean;
}) {
  return (
    <div
      className={`cc-cinematic-card ${className}`.trim()}
      data-testid="cinematic-unified-card"
      data-sweep={sweep || undefined}
    >
      <div className="cc-cinematic-card__sweep" aria-hidden />
      <div className="cc-cinematic-card__avatar" aria-hidden />
      <div className="cc-cinematic-card__body">
        <p className="cc-cinematic-card__name">Jordan Lee</p>
        <p className="cc-cinematic-card__role">Staff Engineer · Platform</p>
        <p className="cc-cinematic-card__bio">
          Projects, research, and proof — one living CodeCard.
        </p>
        <div className="cc-cinematic-card__meta" aria-hidden>
          <span>Projects</span>
          <span>Research</span>
          <span>Share</span>
        </div>
      </div>
    </div>
  );
}

export function FragmentChip({
  label,
  hint,
  kind,
}: {
  label: string;
  hint?: string;
  kind: (typeof SCATTERED_FRAGMENTS)[number]['kind'];
}) {
  const ariaLabel = hint ? `${label}: ${hint}` : label;
  return (
    <div
      className="cc-cinematic-fragment"
      data-kind={kind}
      role="img"
      aria-label={ariaLabel}
    >
      <span className="cc-cinematic-fragment__icon" aria-hidden>
        <FragmentIcon kind={kind} />
      </span>
      <span className="cc-cinematic-fragment__copy">
        <span className="cc-cinematic-fragment__label">{label}</span>
        {hint ? <span className="cc-cinematic-fragment__hint">{hint}</span> : null}
      </span>
    </div>
  );
}
