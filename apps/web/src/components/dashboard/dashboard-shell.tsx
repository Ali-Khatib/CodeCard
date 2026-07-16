'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { DASH_NAV_ICONS } from './dashboard-nav-icons';
import { EmailVerificationBanner } from './email-verification-banner';
import { DashboardPageTransition } from './dashboard-page-transition';
import { DashboardNotifications } from './dashboard-notifications';
import { AppButton } from './ui/dashboard-ui';
import { AsyncActionButton } from '@/components/ui/async-action-button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { applyDarkMode, readDarkPreference } from '@/lib/dashboard/appearance';
import { useDashboardSessionGuard } from '@/hooks/use-dashboard-session-guard';
import { MARKETING_HOME_HREF } from '@/lib/marketing/site-routes';
import { getPublicProfileLinkForClipboard } from '@/lib/sharing/qr';

const NAV_ITEMS = [
  { segment: '', label: 'Home', icon: 'home' as const },
  { segment: 'profile', label: 'Profile', icon: 'profile' as const },
  { segment: 'projects', label: 'Projects', icon: 'projects' as const },
  { segment: 'research', label: 'Research', icon: 'research' as const },
  { segment: 'analytics', label: 'Analytics', icon: 'analytics' as const },
  { segment: 'settings', label: 'Settings', icon: 'settings' as const },
] as const;

const DEMO_SIGN_IN_HREF = `/sign-in?redirect=${encodeURIComponent('/dashboard')}`;

const PAGE_TITLES: Record<string, string> = {
  '': 'Home',
  profile: 'Profile',
  projects: 'Projects',
  research: 'Research',
  circle: 'Circle',
  analytics: 'Analytics',
  connections: 'Connections',
  settings: 'Settings',
  billing: 'Billing',
};

type DashboardShellProps = {
  children: React.ReactNode;
  profileSlug?: string | null;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  completion?: number;
  basePath?: string;
  preview?: boolean;
  emailVerificationRequired?: boolean;
};

function CopyProfileLinkButton({ slug }: { slug: string }) {
  return (
    <AsyncActionButton
      variant="primary"
      block
      ariaLabel="Copy public link"
      successLabel="Public link copied"
      onAction={async () => {
        const url = getPublicProfileLinkForClipboard(slug);
        if (!url) {
          throw new Error('Public profile link is unavailable.');
        }
        await navigator.clipboard.writeText(url);
      }}
    >
      Copy public link
    </AsyncActionButton>
  );
}

export function DashboardShell({
  children,
  profileSlug,
  displayName,
  email,
  avatarUrl,
  completion,
  basePath = '/dashboard',
  preview = false,
  emailVerificationRequired = false,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useDashboardSessionGuard();

  useEffect(() => {
    const stored = localStorage.getItem('cc-sidebar-open');
    if (stored === '0') setSidebarOpen(false);
  }, []);

  useEffect(() => {
    applyDarkMode(readDarkPreference());
  }, []);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    if (!pendingHref) return;
    const timeout = window.setTimeout(() => setPendingHref(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [pendingHref]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => {
      const next = !open;
      localStorage.setItem('cc-sidebar-open', next ? '1' : '0');
      return next;
    });
  }, []);

  const hrefFor = (segment: string) => (segment ? `${basePath}/${segment}` : basePath);

  const markPending = useCallback(
    (href: string) => {
      if (href !== pathname) setPendingHref(href);
      setUserMenuOpen(false);
    },
    [pathname],
  );

  const isActive = (segment: string) => {
    const href = hrefFor(segment);
    if (!segment) return pathname === basePath;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const segment = pathname.replace(basePath, '').replace(/^\//, '').split('/')[0] ?? '';
  const pageTitle = PAGE_TITLES[segment] ?? 'Dashboard';

  const initials = (displayName ?? email ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const navLinks = (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV_ITEMS.map((item) => {
        const href = hrefFor(item.segment);
        const active = isActive(item.segment);
        const pending = pendingHref === href;
        const Icon = DASH_NAV_ICONS[item.icon];
        return (
          <Link
            key={href}
            href={href}
            onClick={() => markPending(href)}
            className={`cc-app-nav-link ${active ? 'cc-app-nav-link--active' : ''} ${pending ? 'cc-app-nav-link--pending' : ''}`}
            aria-busy={pending}
          >
            <Icon />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className={`cc-app-root ${sidebarOpen ? '' : 'cc-app-root--sidebar-collapsed'} ${preview ? 'cc-app-root--preview' : ''} ${pendingHref ? 'cc-app-root--route-pending' : ''}`}>
      {pendingHref && <div className="cc-app-route-progress" aria-hidden />}
      <button
        type="button"
        className="cc-app-sidebar-toggle cc-app-sidebar-toggle--fixed hidden md:inline-flex"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        aria-expanded={sidebarOpen}
      >
        <span className="cc-app-sidebar-toggle__card" aria-hidden>
          <span />
          <span />
        </span>
        <span className="cc-app-sidebar-toggle__chevron" aria-hidden />
      </button>

      <aside className={`cc-app-sidebar ${sidebarOpen ? 'cc-app-sidebar--open' : ''}`}>
        <div className="cc-app-sidebar__head">
          <Link href={basePath} className="cc-app-sidebar__brand">
            CodeCard
          </Link>
        </div>

        <div className="cc-app-user-card mt-8">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--app-border)] bg-[var(--app-paper)]">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[11px] font-medium">
                  {initials}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="break-words text-[14px] font-medium leading-tight text-[var(--app-ink)]">
                {displayName ?? 'Workspace'}
              </p>
              <p className="mt-0.5 break-all text-[12px] leading-tight text-[var(--app-smoke)]">
                @{profileSlug ?? email?.split('@')[0] ?? 'you'}
              </p>
              {completion != null && (
                <span className="cc-app-badge cc-app-badge--blush mt-2 inline-flex">
                  {completion}% ready
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto">{navLinks}</div>

        <div className="mt-4 space-y-2 border-t border-[var(--app-border)] pt-4">
          {preview && (
            <AppButton variant="primary" block href={DEMO_SIGN_IN_HREF}>
              Sign in
            </AppButton>
          )}
          <div className="cc-app-sidebar-appearance">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[var(--app-ink)]">Appearance</p>
              <p className="text-[11px] text-[var(--app-smoke)]">Light or dark</p>
            </div>
            <ThemeToggle />
          </div>
          {profileSlug && <CopyProfileLinkButton slug={profileSlug} />}
          <AppButton variant="ghost" block href={MARKETING_HOME_HREF}>
            ← Back to landing
          </AppButton>
        </div>
      </aside>

      <div className="cc-app-main">
        <header className="cc-app-topbar">
          <div className="cc-app-mobile-theme-toggle md:hidden">
            <ThemeToggle />
          </div>
          <h1 className="cc-app-topbar-title min-w-0 break-words text-[18px] font-medium text-[var(--app-ink)]">{pageTitle}</h1>
          <div className="flex-1" />
          <DashboardNotifications basePath={basePath} />
          <AppButton variant="primary" className="cc-app-topbar-cta shrink-0" href={`${basePath}/projects/new`}>
            Create project
          </AppButton>
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[var(--app-border)] bg-[var(--app-paper)]"
              aria-expanded={userMenuOpen}
              aria-label="User menu"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] font-medium">{initials}</span>
              )}
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-[180px] rounded-[12px] border border-[var(--app-border)] bg-[var(--app-paper)] py-1 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                <p className="border-b border-[var(--app-border)] px-3 py-2 text-[12px] text-[var(--app-smoke)]">
                  {email}
                </p>
                <Link
                  href={`${basePath}/settings`}
                  className="block px-3 py-2 text-[14px] text-[var(--app-ink)] hover:bg-[var(--app-bone)]"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Settings
                </Link>
                {preview ? (
                  <>
                    <Link
                      href={MARKETING_HOME_HREF}
                      className="block px-3 py-2 text-[14px] text-[var(--app-ink)] hover:bg-[var(--app-bone)] md:hidden"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      ← Back to landing
                    </Link>
                    <Link
                      href={DEMO_SIGN_IN_HREF}
                      className="block px-3 py-2 text-[14px] text-[var(--app-ink)] hover:bg-[var(--app-bone)]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/sign-up"
                      className="block px-3 py-2 text-[14px] text-[var(--app-ink)] hover:bg-[var(--app-bone)]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Create account
                    </Link>
                  </>
                ) : (
                  <Link
                    href={`${basePath}/settings`}
                    className="block px-3 py-2 text-[14px] text-[var(--app-smoke)] hover:bg-[var(--app-bone)]"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Sign out
                  </Link>
                )}
              </div>
            )}
          </div>
        </header>

        <div className="cc-app-content">
          {pendingHref && (
            <div className="cc-app-route-pending" role="status" aria-live="polite">
              <span className="cc-app-route-pending__pulse" aria-hidden />
              Loading next view
            </div>
          )}
          {!preview && emailVerificationRequired && email && (
            <EmailVerificationBanner email={email} />
          )}
          <DashboardPageTransition>{children}</DashboardPageTransition>
        </div>
      </div>

      <nav className="cc-app-mobile-nav md:hidden" aria-label="Mobile">
        {NAV_ITEMS.map((item) => {
          const href = hrefFor(item.segment);
          const active = isActive(item.segment);
          const pending = pendingHref === href;
          const Icon = DASH_NAV_ICONS[item.icon];
          return (
            <Link
              key={href}
              href={href}
              onClick={() => markPending(href)}
              className={`cc-app-mobile-nav__link ${
                active ? 'text-[var(--app-ink)]' : 'text-[var(--app-smoke)]'
              } ${pending ? 'cc-app-mobile-nav__link--pending' : ''}`}
              aria-busy={pending}
            >
              <Icon />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
