'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: '/dashboard', label: 'Overview', exact: true },
  { href: '/dashboard/profile', label: 'Profile' },
  { href: '/dashboard/projects', label: 'Projects' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/billing', label: 'Billing' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export function DashboardNav({ profileSlug }: { profileSlug?: string }) {
  const pathname = usePathname();

  return (
    <header className="cc-nav-carbon sticky top-0 z-50">
      <div className="cc-nav-carbon__inner mx-auto max-w-6xl">
        <Link href="/dashboard" className="font-display text-[17px] font-medium text-phosphor">
          Code<span className="text-reactor">Card</span>
        </Link>

        <nav className="relative hidden flex-1 md:flex" aria-label="Dashboard">
          <ul className="flex items-stretch">
            {LINKS.map((link) => {
              const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link href={link.href} className={`cc-nav-link ${active ? 'cc-nav-link--active' : ''}`}>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-4">
          {profileSlug && (
            <Link href={`/${profileSlug}`} target="_blank" className="cc-btn-ghost hidden h-9 px-3 sm:inline-flex">
              /{profileSlug}
            </Link>
          )}
          <Link href="/" className="text-[14px] text-graphite transition-colors hover:text-phosphor">
            Site
          </Link>
        </div>
      </div>
    </header>
  );
}
