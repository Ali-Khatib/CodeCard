'use client';

import { useCallback, type MouseEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home } from 'lucide-react';
import { MARKETING_HOME_HREF } from '@/lib/marketing/site-routes';

/** Top-right home mark. Shown off the landing so Pricing and FAQ can return. */
export function MarketingHomeControl() {
  const pathname = usePathname();
  const router = useRouter();

  const goHome = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      event.stopPropagation();
      router.push(MARKETING_HOME_HREF);
    },
    [router],
  );

  if (pathname === MARKETING_HOME_HREF) return null;

  return (
    <Link
      href={MARKETING_HOME_HREF}
      className="cc-ed-home-control cc-instant-press"
      aria-label="CodeCard landing"
      onClick={goHome}
    >
      <Home size={20} strokeWidth={1.6} aria-hidden />
    </Link>
  );
}
