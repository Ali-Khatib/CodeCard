'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { publicProfileBackHrefForViewer } from '@/lib/profile/public-back-target';

/**
 * Back link on a cached public CodeCard. Signed-out visitors keep the marketing
 * home. Signed-in visitors go to the dashboard Home tab.
 */
export function PublicProfileBackLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [resolved, setResolved] = useState(href);

  useEffect(() => {
    setResolved(publicProfileBackHrefForViewer(href, document.cookie));
  }, [href]);

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const next = publicProfileBackHrefForViewer(href, document.cookie);
    if (next === resolved) return;
    event.preventDefault();
    router.push(next);
  };

  return (
    <Link href={resolved} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
