import {
  BarChart3,
  Briefcase,
  Code2,
  FlaskConical,
  GraduationCap,
  Layers,
  Palette,
  PenLine,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  displayHeadlineParts,
  type HeadlineIconId,
  type HeadlinePart,
} from '@/lib/profile/headline-roles';

const ICONS: Record<HeadlineIconId, LucideIcon> = {
  work: Briefcase,
  code: Code2,
  lab: FlaskConical,
  design: Palette,
  product: Layers,
  data: BarChart3,
  write: PenLine,
  teach: GraduationCap,
  lead: Users,
};

function RoleItem({ part, lead }: { part: HeadlinePart; lead?: boolean }) {
  const Icon = part.icon ? ICONS[part.icon] : null;
  return (
    <span className="cc-headline-roles__item">
      {Icon ? <Icon className="cc-public-hero__line-icon" aria-hidden /> : null}
      <span className={lead ? 'cc-founder-roles__lead' : undefined}>{part.text}</span>
    </span>
  );
}

/** Public headline. Three or more lines keep the first alone and the rest on one row. */
export function HeadlineRoles({
  headline,
  founder = false,
}: {
  headline: string | null | undefined;
  founder?: boolean;
}) {
  const parts = displayHeadlineParts(headline, { founder });
  const [lead, ...rest] = parts;
  if (!lead) return null;
  const stacked = parts.length >= 3;
  const className = [
    'cc-public-hero__headline',
    'cc-headline-roles',
    founder ? 'cc-founder-roles' : '',
    stacked ? 'cc-headline-roles--stacked' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <p className={className}>
      <RoleItem part={lead} lead={founder} />
      {rest.length > 0 ? (
        <span className={stacked ? 'cc-headline-roles__rest' : 'cc-headline-roles__inline'}>
          {rest.map((part, index) => (
            <span key={`${part.text}-${index}`} className="cc-headline-roles__pair">
              {stacked && index === 0 ? null : (
                <span className="cc-headline-roles__sep" aria-hidden>
                  ·
                </span>
              )}
              <RoleItem part={part} />
            </span>
          ))}
        </span>
      ) : null}
    </p>
  );
}
