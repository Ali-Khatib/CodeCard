'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/dashboard/projects', label: 'Projects' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/profile', label: 'Profile' },
  { href: '/dashboard/connections', label: 'Connections' },
  { href: '/dashboard/settings', label: 'Settings' },
] as const;

type DashboardShellProps = {
  children: React.ReactNode;
  profileSlug?: string | null;
};

export function DashboardShell({ children, profileSlug }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const navLinks = (
    <>
      {NAV_LINKS.map((link) => {
        const active = isActive(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileNavOpen(false)}
            className={`rounded-[8px] px-3 py-2 text-left text-[14px] font-medium transition-colors ${
              active
                ? 'bg-reactor/15 font-semibold text-phosphor'
                : 'text-graphite hover:bg-fern/50 hover:text-lichen'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-void-canvas text-phosphor">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_55%_at_20%_0%,rgba(139,92,246,0.14),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(83,110,255,0.08),transparent_50%)]"
        aria-hidden
      />

      <div className="relative flex min-h-screen flex-col md:flex-row">
        <header className="flex items-center justify-between border-b border-border/40 bg-midnight/60 px-4 py-3 backdrop-blur-md md:hidden">
          <Link href="/dashboard/projects" className="font-display text-[17px] font-medium text-vellum">
            CodeCard
          </Link>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 text-vellum"
            aria-expanded={mobileNavOpen}
            aria-label="Toggle dashboard menu"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden>
              <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </header>

        {mobileNavOpen && (
          <nav
            className="flex flex-col gap-1 border-b border-border/30 bg-midnight/80 px-3 py-3 md:hidden"
            aria-label="Dashboard"
          >
            {navLinks}
          </nav>
        )}

        <aside className="hidden w-52 shrink-0 flex-col border-r border-border/30 bg-midnight/50 p-4 md:flex">
          <Link href="/dashboard/projects" className="mb-6 font-display text-[17px] font-medium text-vellum">
            CodeCard
          </Link>
          <nav className="flex flex-col gap-1" aria-label="Dashboard">
            {navLinks}
          </nav>
          {profileSlug && (
            <Link
              href={`/${profileSlug}`}
              target="_blank"
              className="mt-auto pt-8 text-[13px] text-graphite transition-colors hover:text-reactor"
            >
              /{profileSlug} ↗
            </Link>
          )}
        </aside>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="hidden items-center justify-between border-b border-border/40 px-6 py-3 md:flex">
            <p className="font-eyebrow text-[11px] uppercase tracking-[0.08em] text-graphite">
              app.codecard.io{pathname}
            </p>
            <div className="flex items-center gap-4">
              {profileSlug && (
                <Link
                  href={`/${profileSlug}`}
                  target="_blank"
                  className="text-[13px] text-graphite transition-colors hover:text-phosphor"
                >
                  View public profile ↗
                </Link>
              )}
              <Link href="/" className="text-[13px] text-graphite transition-colors hover:text-phosphor">
                Site
              </Link>
            </div>
          </div>

          <main className="flex-1 p-5 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
