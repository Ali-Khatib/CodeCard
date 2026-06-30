'use client';

/**
 * Vivid+Co glass prism — chromatic edge leaks behind editorial type. CSS-only.
 */
export function GlassPrismDecor({ className = '' }: { className?: string }) {
  return (
    <div className={`cc-glass-prism pointer-events-none ${className}`} aria-hidden>
      <div className="cc-glass-prism__body" />
      <div className="cc-glass-prism__edge cc-glass-prism__edge--r" />
      <div className="cc-glass-prism__edge cc-glass-prism__edge--g" />
      <div className="cc-glass-prism__edge cc-glass-prism__edge--b" />
      <div className="cc-glass-prism__sheen" />
    </div>
  );
}
