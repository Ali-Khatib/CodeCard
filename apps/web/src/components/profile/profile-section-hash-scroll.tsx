'use client';

import { useEffect } from 'react';

/**
 * Next.js client navigations often skip native hash scrolling.
 * On public profile, scroll `#projects` / `#research` into view after mount.
 */
export function ProfileSectionHashScroll() {
  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.replace(/^#/, '');
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
      });
    };

    scrollToHash();
    // Dynamic import sections may mount after first paint
    const retry = window.setTimeout(scrollToHash, 120);
    window.addEventListener('hashchange', scrollToHash);
    return () => {
      window.clearTimeout(retry);
      window.removeEventListener('hashchange', scrollToHash);
    };
  }, []);

  return null;
}
