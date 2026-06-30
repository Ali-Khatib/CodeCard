'use client';

import { useEffect } from 'react';

export function MarketingHashRedirect({ hash }: { hash: string }) {
  useEffect(() => {
    const id = hash.replace(/^#/, '');
    window.history.replaceState(null, '', `/#${id}`);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [hash]);

  return null;
}
