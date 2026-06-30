'use client';

import { useRef, useState, useCallback, type ReactNode } from 'react';
import { motion } from 'motion/react';

interface MagneticIconButtonProps {
  href: string;
  ariaLabel: string;
  children: ReactNode;
  accent?: string;
  size?: 'md' | 'lg';
}

export function MagneticIconButton({ href, ariaLabel, children, accent, size = 'md' }: MagneticIconButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMove = useCallback((e: React.MouseEvent) => {
    if (!window.matchMedia('(pointer: fine)').matches || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.18;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.18;
    setOffset({ x, y });
  }, []);

  const onLeave = useCallback(() => setOffset({ x: 0, y: 0 }), []);

  const dim = size === 'lg' ? 'h-11 w-11' : 'h-10 w-10';

  return (
    <motion.a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      title={ariaLabel}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      whileTap={{ scale: 0.92 }}
      className={`group relative flex ${dim} items-center justify-center rounded-full border border-border bg-surface text-text-secondary backdrop-blur-sm transition-colors hover:text-text-primary`}
      style={{ boxShadow: accent ? `0 0 0 0 transparent` : undefined }}
    >
      <span className="text-lg">{children}</span>
      <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{ boxShadow: accent ? `0 0 20px ${accent}33` : '0 0 16px rgba(255,255,255,0.06)' }}
      />
    </motion.a>
  );
}
