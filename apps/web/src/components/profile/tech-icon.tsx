'use client';

import { useEffect, useState } from 'react';
import {
  getTechLabel,
  resolveSimpleIconUrl,
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
      className={`flex h-[1.75em] min-w-[1.75em] items-center justify-center rounded-md border border-lavender/25 bg-midnight/80 px-1 text-[0.42em] font-semibold tracking-wide text-lavender ${className}`}
      aria-hidden
    >
      {techIconAbbreviation(tech)}
    </span>
  );
}

export function TechIcon({ tech, className = '', imgClassName = 'h-[1em] w-[1em]' }: TechIconProps) {
  const Icon = resolveTechIcon(tech);
  const simpleUrl = resolveSimpleIconUrl(tech);
  const [cdnReady, setCdnReady] = useState(false);
  const [cdnFailed, setCdnFailed] = useState(false);

  useEffect(() => {
    setCdnReady(false);
    setCdnFailed(false);
  }, [tech, simpleUrl]);

  if (Icon) {
    return <Icon className={`shrink-0 ${imgClassName} ${className}`} aria-hidden />;
  }

  if (simpleUrl && !cdnFailed) {
    return (
      <span className={`relative inline-flex items-center justify-center ${imgClassName} ${className}`}>
        {!cdnReady && <TechIconFallback tech={tech} className="absolute inset-0 m-auto" />}
        <img
          src={simpleUrl}
          alt=""
          aria-hidden
          className={`object-contain ${imgClassName} transition-opacity duration-150 ${
            cdnReady ? 'relative opacity-100' : 'absolute opacity-0'
          }`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setCdnReady(true)}
          onError={() => setCdnFailed(true)}
        />
      </span>
    );
  }

  return <TechIconFallback tech={tech} className={className} />;
}
