'use client';

import Link from 'next/link';
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
  };

  return (
    <div className="cc-public-dock pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div
        className={cn(
          'pointer-events-auto flex w-full max-w-[min(920px,100%)] min-w-0 items-center gap-1 sm:gap-2',
          'rounded-full border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-paper)_82%,transparent)]',
          'px-1.5 py-1.5 shadow-[0_12px_40px_-18px_rgba(34,34,34,0.35)] backdrop-blur-xl sm:px-2',
        )}
      >
        <Link
          href={backHref}
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-[var(--app-ink)] transition-colors hover:bg-[var(--app-bone)] sm:px-3"
        >
          <span aria-hidden>←</span>
          <span className="hidden truncate sm:inline">{backLabel}</span>
          <span className="sm:hidden">Back</span>
        </Link>

        <nav
          aria-label="CodeCard sections"
          className="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => jump(item.id)}
              className={cn(
                'min-h-9 shrink-0 rounded-full px-2.5 text-[12px] font-medium transition-colors sm:px-3 sm:text-[13px]',
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

        <div className="flex shrink-0 items-center">
          <ThemeToggle className="shrink-0" />
        </div>
      </div>
    </div>
  );
}
