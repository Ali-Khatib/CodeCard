/** Lightweight CodeCard-shaped preview used by landing cinematic scenes (no workspace imports). */

export const SCATTERED_FRAGMENTS = [
  { id: 'github', label: 'GitHub', kind: 'link' },
  { id: 'projects', label: 'Projects', kind: 'work' },
  { id: 'research', label: 'Research', kind: 'paper' },
  { id: 'resume', label: 'Resume', kind: 'doc' },
  { id: 'linkedin', label: 'LinkedIn', kind: 'link' },
  { id: 'analytics', label: 'Analytics', kind: 'chart' },
  { id: 'qr', label: 'QR share', kind: 'qr' },
  { id: 'docs', label: 'Documents', kind: 'doc' },
] as const;

export type ScatteredFragmentId = (typeof SCATTERED_FRAGMENTS)[number]['id'];

export const PRODUCT_SHOWCASE_STAGES = [
  'Profile',
  'Projects',
  'Research',
  'Sharing',
  'Analytics',
] as const;

export type ProductShowcaseStage = (typeof PRODUCT_SHOWCASE_STAGES)[number];

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
  kind,
}: {
  label: string;
  kind: (typeof SCATTERED_FRAGMENTS)[number]['kind'];
}) {
  return (
    <div className="cc-cinematic-fragment" data-kind={kind}>
      <span className="cc-cinematic-fragment__mark" aria-hidden />
      <span className="cc-cinematic-fragment__label">{label}</span>
    </div>
  );
}
