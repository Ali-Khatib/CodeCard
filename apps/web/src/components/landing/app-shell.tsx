'use client';

import { LandingShellNav } from './landing-shell-nav';
import { HumeFooterCluster } from './hume-footer-cluster';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="cc-marketing-shell relative min-h-[100dvh] bg-bone text-ink">
      <div className="relative z-[1]">
        <LandingShellNav />
        <main>{children}</main>
        <HumeFooterCluster />
      </div>
    </div>
  );
}
