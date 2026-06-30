import Link from 'next/link';

type ArrowCtaProps = {
  href: string;
  label: string;
  external?: boolean;
};

export function ArrowCta({ href, label, external }: ArrowCtaProps) {
  const className = 'cc-arrow-cta group inline-flex items-center gap-2 transition-colors';

  const arrow = (
    <span className="cc-arrow-cta__btn" aria-hidden>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M3 8h10M9 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );

  if (external || href.startsWith('http') || href.startsWith('#')) {
    return (
      <a href={href} className={className}>
        <span>{label}</span>
        {arrow}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      <span>{label}</span>
      {arrow}
    </Link>
  );
}
