'use client';

import { useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyDarkMode, readDarkPreference } from '@/lib/dashboard/appearance';
import { cn } from '@/lib/utils';
import { MOTION_FEEDBACK } from '@/components/motion/motion-tokens';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false);
  const [justChanged, setJustChanged] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const dark = readDarkPreference();
    applyDarkMode(dark);
    setIsDark(dark);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    applyDarkMode(next);
    setJustChanged(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setJustChanged(false), MOTION_FEEDBACK.successMs);
  };

  return (
    <div
      className={cn(
        'flex h-8 w-16 cursor-pointer rounded-full p-1 transition-all duration-300',
        isDark
          ? 'border border-zinc-800 bg-zinc-950'
          : 'border border-[var(--app-border)] bg-[var(--app-paper)]',
        justChanged && 'ring-2 ring-[var(--app-iris)]',
        className,
      )}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-live="polite"
      data-theme-success={justChanged ? 'true' : 'false'}
      data-testid="theme-toggle"
    >
      <div className="flex w-full items-center justify-between">
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-300',
            isDark ? 'translate-x-0 bg-zinc-800' : 'translate-x-8 bg-[var(--app-bone)]',
          )}
        >
          {isDark ? (
            <Moon className="h-4 w-4 text-white" strokeWidth={1.5} />
          ) : (
            <Sun className="h-4 w-4 text-[var(--app-ink)]" strokeWidth={1.5} />
          )}
        </div>
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-300',
            isDark ? 'bg-transparent' : '-translate-x-8',
          )}
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
          ) : (
            <Moon className="h-4 w-4 text-[var(--app-smoke)]" strokeWidth={1.5} />
          )}
        </div>
      </div>
      <span className="sr-only">{justChanged ? (isDark ? 'Dark mode on' : 'Light mode on') : null}</span>
    </div>
  );
}
