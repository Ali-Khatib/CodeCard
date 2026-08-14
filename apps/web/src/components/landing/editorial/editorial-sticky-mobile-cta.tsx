'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Mobile-only sticky conversion CTA for the long editorial landing.
 * Hidden while the hero primary CTA is still in view; respects iOS safe-area.
 */
export function EditorialStickyMobileCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const heroCta = document.querySelector<HTMLElement>('[data-testid="hero-primary-cta"]');
    if (!heroCta || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0.15 },
    );
    observer.observe(heroCta);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden"
      data-testid="sticky-mobile-cta"
    >
      <div
        className="pointer-events-auto border-t border-[color-mix(in_srgb,var(--app-ink)_12%,transparent)] bg-[color-mix(in_srgb,var(--app-canvas)_92%,transparent)] px-4 pt-3 backdrop-blur-md"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <Link
          href="/sign-up"
          className="cc-ed__btn-primary cc-instant-press flex min-h-11 w-full items-center justify-center"
        >
          Create Your CodeCard
        </Link>
      </div>
    </div>
  );
}
