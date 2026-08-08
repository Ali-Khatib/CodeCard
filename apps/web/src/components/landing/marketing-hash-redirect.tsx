'use client';

import { useEffect } from 'react';
import { MARKETING_HOME_HREF } from '@/lib/marketing/site-routes';

/**
 * Soft client navigations to /how-it-works (etc.) must fully load home —
 * history.replaceState alone leaves an empty AppShell + footer (broken page).
 */
export function MarketingHashRedirect({ hash }: { hash: string }) {
  useEffect(() => {
    const id = hash.replace(/^#/, '');
    window.location.replace(`${MARKETING_HOME_HREF}#${id}`);
  }, [hash]);

  return (
    <p className="cc-container py-24 text-[15px] text-text-secondary" aria-live="polite">
      Taking you there…
    </p>
  );
}
