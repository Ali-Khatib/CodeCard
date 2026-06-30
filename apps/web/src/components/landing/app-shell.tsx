'use client';

import Link from 'next/link';
import { LandingShellNav } from './landing-shell-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] text-text-primary">
      <div className="relative z-[1]">
        <LandingShellNav />
        {children}
        <footer className="border-t border-stone py-16">
          <div className="cc-container flex flex-col items-center gap-4 text-center">
            <p className="font-display text-[28px] font-medium tracking-[-0.02em] text-phosphor">CodeCard.</p>
            <p className="max-w-[440px] font-sans text-[17px] leading-relaxed text-ash md:text-[18px]">
              Let your work do the talking.
            </p>
            <div className="text-[14px] text-graphite">
              <Link href="/#research" className="transition-colors hover:text-reactor">
                Research
              </Link>
              <span className="mx-3 text-stone">·</span>
              <Link href="/legal/privacy" className="transition-colors hover:text-reactor">
                Privacy
              </Link>
              <span className="mx-3 text-stone">·</span>
              <Link href="/legal/terms" className="transition-colors hover:text-reactor">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
