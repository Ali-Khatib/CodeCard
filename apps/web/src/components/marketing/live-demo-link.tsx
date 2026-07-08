import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { LIVE_DEMO_HREF, LIVE_DEMO_PROFILE_HREF, LIVE_DEMO_WORKSPACE_HREF } from '@/lib/marketing/demo-url';
import { cn } from '@/lib/utils';

type LiveDemoLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children?: ReactNode;
};

/** Full-page navigation into the demo workspace (avoids stale RSC chunks in dev). */
export function LiveDemoLink({ href = LIVE_DEMO_HREF, className, children, ...props }: LiveDemoLinkProps) {
  return (
    <a href={href} className={cn(className)} {...props}>
      {children}
    </a>
  );
}

export function isLiveDemoHref(href: string): boolean {
  return (
    href === LIVE_DEMO_HREF ||
    href === LIVE_DEMO_WORKSPACE_HREF ||
    href === LIVE_DEMO_PROFILE_HREF ||
    href === '/demo/card' ||
    href === '/dashboard/preview' ||
    href.startsWith('/dashboard/preview/')
  );
}
