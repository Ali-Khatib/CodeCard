'use client';

import Link from 'next/link';
import { COLORS, LAYOUT, TYPE } from '@/lib/design/tokens';

export function LandingCardNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-[90] flex justify-center px-6 pt-5 md:px-12">
      <nav
        className="flex w-full max-w-[1180px] items-center justify-between rounded-lg border border-border bg-surface/90 px-5 backdrop-blur-xl"
        style={{ height: LAYOUT.navHeight }}
        aria-label="Site"
      >
        <Link href="/" className="flex items-center gap-2.5 text-[15px] font-semibold text-text-primary">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-md text-[12px] font-bold"
            style={{ backgroundColor: `${COLORS.accent}22`, color: COLORS.accent }}
          >
            CC
          </span>
          CodeCard
        </Link>

        <p className={`hidden ${TYPE.nav} text-text-secondary sm:block`}>Product</p>

        <div className={`flex items-center gap-4 ${TYPE.nav}`}>
          <Link href="/pricing" className="text-text-secondary transition-colors hover:text-text-primary">
            Pricing
          </Link>
          <Link
            href="/sign-in"
            className="rounded-md border border-border px-3 py-1.5 text-text-primary transition-colors hover:border-accent/40"
          >
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}
