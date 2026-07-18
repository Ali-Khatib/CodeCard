'use client';

import { useEffect } from 'react';
import { MARKETING_HOME_HREF } from '@/lib/marketing/site-routes';
import { scrollBehaviorForPreference } from '@/hooks/use-reduced-motion';

export function MarketingHashRedirect({ hash }: { hash: string }) {
  useEffect(() => {
    const id = hash.replace(/^#/, '');
    window.history.replaceState(null, '', `${MARKETING_HOME_HREF}#${id}`);
    requestAnimationFrame(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: scrollBehaviorForPreference() });
    });
  }, [hash]);

  return null;
}
