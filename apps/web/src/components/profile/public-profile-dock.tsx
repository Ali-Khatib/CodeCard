'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { scrollBehaviorForPreference } from '@/hooks/use-reduced-motion';

const SECTIONS = [
  { id: 'profile-hero', label: 'Profile' },
  { id: 'projects', label: 'Work' },
  { id: 'research', label: 'Research' },
] as const;

type PublicProfileDockProps = {
  backHref: string;
  backLabel: string;
  hasResearch: boolean;
};

/** Floating section nav + theme toggle for the public CodeCard. */
export function PublicProfileDock({ backHref, backLabel, hasResearch }: PublicProfileDockProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>('profile-hero');
  const items = SECTIONS.filter((s) => s.id !== 'research' || hasResearch);

  useEffect(() => {
    const ids = items.map((item) => item.id);
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: '-28% 0px -55% 0px', threshold: [0.08, 0.2, 0.4] },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [hasResearch]);

  const jump = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: scrollBehaviorForPreference(), block: 'start' });
    setOpen(false);
  };

  return (
    <div className="cc-public-dock pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div
        className={cn(
          'pointer-events-auto flex w-full max-w-[min(920px,100%)] min-w-0 items-center gap-2',
          'rounded-full border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-paper)_82%,transparent)]',
          'px-2 py-1.5 shadow-[0_12px_40px_-18px_rgba(34,34,34,0.35)] backdrop-blur-xl',
        )}
      >
        <Link
          href={backHref}
          className="inline-flex min-h-10 min-w-0 shrink items-center gap-1.5 truncate rounded-full px-3 text-[13px] font-medium text-[var(--app-ink)] transition-colors hover:bg-[var(--app-bone)]"
        >
          <span aria-hidden>←</span>
          <span className="hidden truncate sm:inline">{backLabel}</span>
          <span className="sm:hidden">Back</span>
        </Link>

        <nav
          aria-label="CodeCard sections"
          className="relative ml-auto hidden items-center gap-0.5 md:flex"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => jump(item.id)}
              className={cn(
                'min-h-9 rounded-full px-3 text-[13px] font-medium transition-colors',
                active === item.id
                  ? 'bg-[var(--app-ink)] text-[var(--app-paper)]'
                  : 'text-[var(--app-smoke)] hover:bg-[var(--app-bone)] hover:text-[var(--app-ink)]',
              )}
              aria-current={active === item.id ? 'true' : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <ThemeToggle className="shrink-0" />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-paper)] text-[var(--app-ink)] md:hidden"
            aria-expanded={open}
            aria-controls="cc-public-dock-menu"
            aria-label={open ? 'Close section menu' : 'Open section menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" strokeWidth={1.75} /> : <Menu className="h-4 w-4" strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="cc-public-dock-menu"
          className="pointer-events-auto absolute left-3 right-3 top-[calc(100%+0.5rem)] rounded-2xl border border-[var(--app-border)] bg-[var(--app-paper)] p-2 shadow-lg md:hidden"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => jump(item.id)}
              className={cn(
                'flex min-h-11 w-full items-center rounded-xl px-3 text-left text-[15px] font-medium',
                active === item.id
                  ? 'bg-[var(--app-bone)] text-[var(--app-ink)]'
                  : 'text-[var(--app-smoke)]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
