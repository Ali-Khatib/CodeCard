'use client';

import {
  resolveTechIcon,
  techIconAbbreviation,
} from '@/lib/icons/tech-icons';

interface TechIconProps {
  tech: string;
  className?: string;
  imgClassName?: string;
}

function TechIconFallback({
  tech,
  className = '',
}: {
  tech: string;
  className?: string;
}) {
  return (
    <span
      className={`flex h-[1.75em] min-w-[1.75em] items-center justify-center rounded-md border border-black/25 bg-[#fcf1e7] px-1 text-[0.42em] font-semibold tracking-wide text-[#111111] ${className}`}
      aria-hidden
    >
      {techIconAbbreviation(tech)}
    </span>
  );
}

export function TechIcon({ tech, className = '', imgClassName = 'h-[1em] w-[1em]' }: TechIconProps) {
  const Icon = resolveTechIcon(tech);

  if (Icon) {
    return (
      <Icon
        className={`shrink-0 text-[#111111] ${imgClassName} ${className}`}
        color="#111111"
        aria-hidden
      />
    );
  }

  return <TechIconFallback tech={tech} className={className} />;
}
