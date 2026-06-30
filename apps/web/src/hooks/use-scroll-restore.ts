'use client';

import { useEffect } from 'react';

const SCROLL_KEY = (slug: string) => `codecard:scroll:${slug}`;

export function useScrollRestore(profileSlug: string) {
  useEffect(() => {
    const key = SCROLL_KEY(profileSlug);
    const saved = sessionStorage.getItem(key);
    if (saved) {
      const y = Number(saved);
      requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }));
      sessionStorage.removeItem(key);
    }

    return () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };
  }, [profileSlug]);
}

export function saveScrollForProfile(profileSlug: string) {
  sessionStorage.setItem(SCROLL_KEY(profileSlug), String(window.scrollY));
}
