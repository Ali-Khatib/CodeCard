'use client';

import { LandingShellNav } from './landing-shell-nav';
import { HumeFooterCluster } from './hume-footer-cluster';
import { MAIN_CONTENT_ID } from '@/lib/a11y/main-content';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="cc-marketing-shell relative min-h-[100dvh] bg-bone text-ink">
      <div className="relative z-[1]">
        <LandingShellNav />
        <main id={MAIN_CONTENT_ID} tabIndex={-1} className="cc-marketing-main">
          {children}
        </main>
        <HumeFooterCluster />
      </div>
    </div>
  );
}
