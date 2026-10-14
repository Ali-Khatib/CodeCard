import { cn } from '@/lib/utils';

const DEFAULT_LIMIT = 4;

/** Compact stack line: `React · TypeScript · Python · +2`. Empty lists render nothing. */
export function formatProjectTech(technologies: string[], limit = DEFAULT_LIMIT): string | null {
  const names = technologies.map((tech) => tech.trim()).filter(Boolean);
  if (names.length === 0) return null;
  const shown = names.slice(0, limit);
  const extra = names.length - shown.length;
  return extra > 0 ? `${shown.join(' · ')} · +${extra}` : shown.join(' · ');
}

export function ProjectTechLine({
  technologies,
  className,
}: {
  technologies: string[];
  className?: string;
}) {
  const line = formatProjectTech(technologies);
  if (!line) return null;
  return <p className={cn('cc-project-tech-line', className)}>{line}</p>;
}
