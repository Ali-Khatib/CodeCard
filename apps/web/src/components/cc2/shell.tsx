'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { MAIN_CONTENT_ID } from '@/lib/a11y/main-content';
import { Cc2Footer } from './footer';
import { IntroProvider } from './intro';
import { Cc2Nav } from './nav';
import '@/styles/cc2.css';

/**
 * Marketing shell. Replaces the old AppShell, backdrop and route transition.
 * Font variables come from the marketing layout (next/font).
 */
export function Cc2Shell({ children, fontClass = '' }: { children: ReactNode; fontClass?: string }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <IntroProvider enabled={isHome}>
      <div className={`cc2 ${fontClass}`.trim()} data-cc2>
        <noscript>
          <style>{'.cc2-line__in{transform:none!important}.cc2-intro{display:none!important}.cc2-hero__fade,.cc2-hero__enter{opacity:1!important;transform:none!important}'}</style>
        </noscript>
        <Cc2Nav />
        <main id={MAIN_CONTENT_ID} tabIndex={-1} className="cc2-main">
          {children}
        </main>
        <Cc2Footer />
      </div>
    </IntroProvider>
  );
}
