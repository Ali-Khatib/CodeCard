'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import { MutationFeedbackProvider } from '@/components/dashboard/mutation-feedback-provider';
import { MAIN_CONTENT_ID } from '@/lib/a11y/main-content';

const NAV_ITEMS = [
  { segment: '', label: 'Home', icon: 'home' as const },
  { segment: 'profile', label: 'Profile', icon: 'profile' as const },
  { segment: 'projects', label: 'Projects', icon: 'projects' as const },
  { segment: 'research', label: 'Research', icon: 'research' as const },
  { segment: 'connections', label: 'Connections', icon: 'connections' as const },
  { segment: 'circle', label: 'Circle', icon: 'circle' as const },
  { segment: 'analytics', label: 'Analytics', icon: 'analytics' as const },
  { segment: 'settings', label: 'Settings', icon: 'settings' as const },
] as const;

/** Marketing iframe bottom nav — five icons that fit one phone row with no scroll jump. */
const EMBED_NAV_SEGMENTS = new Set(['', 'projects', 'research', 'connections', 'circle']);

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
  /** Private Circle freshness badge ("1"…"9" or "9+"); never demo values. */
  circleUnreadBadge?: string | null;
};

function CopyProfileLinkButton({ slug }: { slug: string }) {
  return (
    <AsyncActionButton
      variant="primary"
      block
      className="cc-workspace-copy-link"
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
  circleUnreadBadge = null,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [embedded, setEmbedded] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const activePillRef = useRef<HTMLSpanElement>(null);

  useDashboardSessionGuard();

  useEffect(() => {
    try {
      const inIframe = window.self !== window.top;
      const embedParam = new URLSearchParams(window.location.search).get('embed') === '1';
      setEmbedded(inIframe || embedParam);
    } catch {
      setEmbedded(true);
    }
  }, []);

  useEffect(() => {
    if (embedded) {
      // Marketing iframe: sidebar is unused on phone and the toggle clips the chrome.
      setSidebarOpen(false);
      return;
    }
    const stored = localStorage.getItem('cc-sidebar-open');
    if (stored === '0') setSidebarOpen(false);
  }, [embedded]);

  useEffect(() => {
    applyDarkMode(readDarkPreference());
  }, []);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const nav = document.querySelector('.cc-app-mobile-nav');
    if (!(nav instanceof HTMLElement)) return;
    const active = nav.querySelector('a[aria-current="page"]');
    if (!(active instanceof HTMLElement)) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Scroll the nav itself rather than calling scrollIntoView on the link:
    // scrollIntoView moves the sequential focus navigation starting point into
    // this nav, which would make the skip link unreachable on the first Tab.
    const left = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
    nav.scrollTo({ left: Math.max(0, left), behavior: reduced ? 'auto' : 'smooth' });
  }, [pathname]);

  useEffect(() => {
    if (embedded) setPendingHref(null);
  }, [embedded]);

  useEffect(() => {
    if (!pendingHref) return;
    // Marketing iframe: never stick on "Loading next view".
    const ms = embedded ? 0 : 5000;
    const timeout = window.setTimeout(() => setPendingHref(null), ms);
    return () => window.clearTimeout(timeout);
  }, [pendingHref, embedded]);

  const syncActivePill = useCallback(() => {
    const nav = navRef.current;
    const pill = activePillRef.current;
    if (!nav || !pill) return;
    const active = nav.querySelector<HTMLElement>('a[aria-current="page"]');
    if (!active) {
      pill.style.opacity = '0';
      return;
    }
    pill.style.opacity = '1';
    pill.style.transform = `translateY(${active.offsetTop}px)`;
  }, []);

  useLayoutEffect(() => {
    syncActivePill();
  }, [pathname, sidebarOpen, syncActivePill]);

  useEffect(() => {
    const onResize = () => syncActivePill();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [syncActivePill]);

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
      if (embedded) {
        setUserMenuOpen(false);
        return;
      }
      if (href !== pathname) setPendingHref(href);
      setUserMenuOpen(false);
    },
    [pathname, embedded],
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
    <nav ref={navRef} className="cc-app-nav flex flex-col gap-1" aria-label="Main">
      <span ref={activePillRef} className="cc-app-nav__active-pill" aria-hidden data-testid="sidebar-active-indicator" />
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
            aria-current={active ? 'page' : undefined}
            aria-busy={pending}
            data-nav-segment={item.segment || 'home'}
            aria-label={
              item.segment === 'circle' && circleUnreadBadge
                ? `Circle, ${circleUnreadBadge} new`
                : undefined
            }
          >
            <Icon />
            <span className="inline-flex min-w-0 items-center gap-2">
              {item.label}
              {item.segment === 'circle' && circleUnreadBadge ? (
                <span
                  className="cc-app-badge cc-app-badge--mint inline-flex min-w-[1.25rem] justify-center px-1.5 text-[11px]"
                  aria-hidden
                >
                  {circleUnreadBadge}
                </span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <MutationFeedbackProvider>
    <div className={`cc-app-root ${sidebarOpen ? '' : 'cc-app-root--sidebar-collapsed'} ${preview ? 'cc-app-root--preview' : ''} ${pendingHref && !embedded ? 'cc-app-root--route-pending' : ''} ${embedded ? 'cc-app-root--embedded' : ''}`}>
      {pendingHref && !embedded && <div className="cc-app-route-progress" aria-hidden />}
      {!embedded ? (
        <button
          type="button"
          className="cc-app-sidebar-toggle cc-app-sidebar-toggle--fixed"
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
      ) : null}

      <aside className={`cc-app-sidebar ${sidebarOpen ? 'cc-app-sidebar--open' : ''}`}>
        <div className="cc-app-sidebar__head">
          <Link href={basePath} className="cc-app-sidebar__brand">
            CodeCard
          </Link>
        </div>

        <Link
          href={`${basePath}/profile`}
          className="cc-app-user-card cc-app-user-card--link mt-8 block"
          aria-label="Open profile editor: photo, bio, and links"
        >
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
              <p className="mt-1.5 text-[11px] font-medium text-[var(--app-iris)]">
                Edit photo, bio, links
              </p>
              {completion != null && (
                <span className="cc-app-badge cc-app-badge--blush mt-2 inline-flex">
                  {completion}% ready
                </span>
              )}
            </div>
          </div>
        </Link>

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
          {!embedded ? (
            <div className="cc-app-mobile-theme-toggle md:hidden">
              <ThemeToggle />
            </div>
          ) : null}
          <h1 className="cc-app-topbar-title min-w-0 break-words text-[18px] font-medium text-[var(--app-ink)]">
            {embedded ? 'Live demo' : pageTitle}
          </h1>
          <div className="flex-1" />
          {!embedded ? <DashboardNotifications basePath={basePath} /> : null}
          {!embedded ? (
            <AppButton
              variant="primary"
              className="cc-app-topbar-cta shrink-0"
              href={`${basePath}/projects/new`}
              ariaLabel="Create project"
            >
              Create project
            </AppButton>
          ) : (
            <AppButton
              variant="primary"
              className="cc-app-topbar-cta shrink-0"
              href={DEMO_SIGN_IN_HREF}
              ariaLabel="Sign in to CodeCard"
            >
              Sign in
            </AppButton>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex h-11 w-11 min-h-11 min-w-11 items-center justify-center overflow-hidden rounded-full border border-[var(--app-border)] bg-[var(--app-paper)]"
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
                  href={`${basePath}/profile`}
                  className="block px-3 py-2 text-[14px] text-[var(--app-ink)] hover:bg-[var(--app-bone)]"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Edit profile
                </Link>
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

        <main id={MAIN_CONTENT_ID} tabIndex={-1} className="cc-app-content">
          {pendingHref && !embedded && (
            <div className="cc-app-route-pending" role="status" aria-live="polite">
              <span className="cc-app-route-pending__pulse" aria-hidden />
              Loading next view
            </div>
          )}
          {!preview && emailVerificationRequired && email && (
            <EmailVerificationBanner email={email} />
          )}
          <DashboardPageTransition>{children}</DashboardPageTransition>
        </main>
      </div>

      <nav className="cc-app-mobile-nav md:hidden" aria-label="Mobile">
        {(embedded
          ? NAV_ITEMS.filter((item) => EMBED_NAV_SEGMENTS.has(item.segment))
          : NAV_ITEMS
        ).map((item) => {
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
              } ${pending ? 'cc-app-mobile-nav__link--pending' : ''} ${
                embedded ? 'cc-app-mobile-nav__link--embed' : ''
              }`}
              aria-current={active ? 'page' : undefined}
              aria-busy={pending}
              aria-label={
                item.segment === 'circle' && circleUnreadBadge
                  ? `Circle, ${circleUnreadBadge} new`
                  : undefined
              }
            >
              <Icon />
              <span className="inline-flex items-center gap-1">
                {item.label}
                {item.segment === 'circle' && circleUnreadBadge ? (
                  <span className="cc-app-badge cc-app-badge--mint px-1 text-[10px]" aria-hidden>
                    {circleUnreadBadge}
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
    </MutationFeedbackProvider>
  );
}
