'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface ProjectMediaProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
}

export function ProjectMedia({
  src,
  alt = '',
  className = '',
  style,
  priority,
  sizes,
}: ProjectMediaProps) {
  const [loaded, setLoaded] = useState(priority ?? false);

  useEffect(() => {
    if (priority) setLoaded(true);
  }, [priority, src]);

  const mediaClass = `object-cover object-top transition-opacity duration-300 ${
    loaded ? 'opacity-100' : 'opacity-0'
  } ${className}`;

  if (src.startsWith('data:')) {
    return (
      <div className="absolute inset-0">
        {!loaded && <div className="cc-media-placeholder absolute inset-0" aria-hidden />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 h-full w-full ${mediaClass}`}
          style={style}
          onLoad={() => setLoaded(true)}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      {!loaded && <div className="cc-media-placeholder absolute inset-0" aria-hidden />}
      <Image
        src={src}
        alt={alt}
        fill
        className={mediaClass}
        style={style}
        sizes={sizes ?? '100vw'}
        priority={priority}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
