'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Mobile-only sticky conversion CTA for the long editorial landing.
 * Matches hero/finale primary (cream chip on dark) — not a cream tray strip.
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
      className="cc-ed-sticky-cta md:hidden"
      data-testid="sticky-mobile-cta"
    >
      <Link
        href="/sign-up"
        className="cc-ed-sticky-cta__btn cc-instant-press"
      >
        Create Your CodeCard
      </Link>
    </div>
  );
}
