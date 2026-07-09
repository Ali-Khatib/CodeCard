'use client';

import Link from 'next/link';
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { DEMO_NOTIFICATIONS, type DashboardNotification } from '@/lib/dashboard/notifications-demo';
import { useIsMobile } from '@/hooks/use-is-mobile';

const TYPE_ICON: Record<DashboardNotification['type'], string> = {
  project: '◆',
  save: '♡',
  recap: '▣',
  activity: '◎',
};

export function DashboardNotifications({ basePath = '/dashboard' }: { basePath?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(DEMO_NOTIFICATIONS);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();
  const unread = useMemo(() => items.filter((n) => n.unread).length, [items]);

  useLayoutEffect(() => {
    if (!open || !isMobile || !triggerRef.current) {
      setPanelStyle(undefined);
      return;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const panelWidth = Math.min(window.innerWidth * 0.92, 360);
      const margin = 12;
      const right = Math.max(margin, window.innerWidth - rect.right);
      const left = Math.min(
        Math.max(margin, rect.right - panelWidth),
        window.innerWidth - panelWidth - margin,
      );

      setPanelStyle({
        top: rect.bottom + 8,
        left,
        right: 'auto',
        width: panelWidth,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { passive: true });

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isMobile, open]);

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const resolveHref = (href?: string) => {
    if (!href) return basePath;
    if (basePath === '/dashboard/preview') {
      return href.replace('/dashboard', '/dashboard/preview');
    }
    return href.replace('/dashboard/preview', '/dashboard');
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="cc-app-icon-btn relative"
        aria-expanded={open}
        aria-label={unread ? `${unread} unread notifications` : 'Notifications'}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path
            d="M10 2.5a5 5 0 0 0-5 5v2.8l-1.2 2.4a1 1 0 0 0 .9 1.5h10.6a1 1 0 0 0 .9-1.5L15 10.3V7.5a5 5 0 0 0-5-5Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M8.5 16a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--app-iris)] px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div
            className={`cc-app-notifications-panel z-50 ${
              isMobile ? 'cc-app-notifications-panel--mobile fixed' : 'absolute right-0 top-full mt-2'
            }`}
            style={
              isMobile
                ? panelStyle
                : { width: 'min(360px, calc(100vw - 2rem))' }
            }
          >
            <div className="flex items-center justify-between border-b border-[var(--app-border)] px-4 py-3">
              <p className="text-[16px] font-medium text-[var(--app-ink)]">Notifications</p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[13px] font-medium text-[var(--app-smoke)] hover:text-[var(--app-ink)]"
                >
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-[360px] overflow-y-auto py-1">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={resolveHref(n.href)}
                    onClick={() => setOpen(false)}
                    className={`flex gap-3 px-4 py-3 transition-colors hover:bg-[var(--app-bone)] ${
                      n.unread ? 'bg-[var(--app-rose-mist)]' : ''
                    }`}
                  >
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-bone)] text-[13px] text-[var(--app-smoke)]"
                      aria-hidden
                    >
                      {TYPE_ICON[n.type]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-[var(--app-ink)]">{n.title}</p>
                      <p className="mt-0.5 text-[13px] leading-snug text-[var(--app-smoke)]">{n.body}</p>
                      <p className="mt-1 text-[12px] text-[var(--app-smoke)]">{n.time}</p>
                    </div>
                    {n.unread && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--app-iris)]" aria-hidden />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
