'use client';

import { useEffect } from 'react';

/** Sets --pointer-x / --pointer-y (0–1) on documentElement — one listener sitewide. */
export function useGlobalPointer() {
  useEffect(() => {
    let raf = 0;
    let x = 0.5;
    let y = 0.3;

    const apply = () => {
      raf = 0;
      document.documentElement.style.setProperty('--pointer-x', String(x));
      document.documentElement.style.setProperty('--pointer-y', String(y));
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX / window.innerWidth;
      y = e.clientY / window.innerHeight;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onScroll = () => {
      const scrollY = window.scrollY;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = scrollY / max;
      document.documentElement.style.setProperty('--scroll-y', String(progress));
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    apply();
    onScroll();

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}
