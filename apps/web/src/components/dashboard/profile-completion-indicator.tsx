'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CountUp } from '@/components/landing/count-up';
import type { ProfileCompletionResult } from '@/lib/profile/completion';
import { AppCard, AppMono } from './ui/dashboard-ui';

type ProfileCompletionIndicatorProps = {
  completion: ProfileCompletionResult;
  variant?: 'full' | 'compact';
};

export function ProfileCompletionIndicator({
  completion,
  variant = 'full',
}: ProfileCompletionIndicatorProps) {
  const { percentage, completedCount, totalCount, criteria } = completion;
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();

  if (variant === 'compact') {
    return (
      <div>
        <AppMono>Completion</AppMono>
        <p className="mt-2 text-[28px] font-medium" aria-live="polite">
          Profile <CountUp value={percentage} />% complete
        </p>
        <p className="sr-only">
          {completedCount} of {totalCount} profile completion criteria complete.
        </p>
      </div>
    );
  }

  return (
    <AppCard className="cc-profile-completion-card relative overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <AppMono>Profile completion</AppMono>
          <p className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
            Profile <CountUp value={percentage} />% complete
          </p>
          <p className="mt-1 text-[14px] text-[var(--app-smoke)]">
            {completedCount} of {totalCount} criteria complete
          </p>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          aria-label={expanded ? 'Hide profile completion progress' : 'View profile completion progress'}
          onClick={() => setExpanded((open) => !open)}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-paper)] px-3 text-[13px] font-medium text-[var(--app-ink)] transition-colors hover:bg-[var(--app-bone)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-iris)] focus-visible:ring-offset-2"
        >
          <span className="hidden sm:inline">{expanded ? 'Hide progress' : 'View progress'}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${
              expanded ? 'rotate-180' : ''
            }`}
            aria-hidden
          />
        </button>
      </div>

      <div
        id={detailsId}
        aria-hidden={!expanded}
        className={`grid origin-top-right transition-[grid-template-rows,opacity,margin,transform] duration-500 ease-out ${
          expanded
            ? 'mt-5 grid-rows-[1fr] translate-y-0 scale-100 opacity-100'
            : 'mt-0 grid-rows-[0fr] -translate-y-2 scale-[0.98] opacity-0'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className="h-2 overflow-hidden rounded-full bg-[var(--app-bone)]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            aria-label={`Profile ${percentage}% complete`}
          >
            <div
              className="h-full rounded-full bg-[var(--app-iris)] transition-[width] duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <ul className="mt-5 space-y-2" aria-label="Profile completion checklist">
            {criteria.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-[var(--app-border)] px-3 py-2 text-[14px]"
              >
                <span className="font-medium text-[var(--app-ink)]">{item.label}</span>
                <span className="flex items-center gap-2">
                  <span aria-hidden>{item.complete ? '✓' : '○'}</span>
                  <span
                    className={
                      item.complete ? 'text-[var(--app-ink)]' : 'text-[var(--app-smoke)]'
                    }
                  >
                    {item.complete ? 'Complete' : 'Incomplete'}
                  </span>
                  {!item.complete ? (
                    <Link
                      href={item.href}
                      tabIndex={expanded ? undefined : -1}
                      className="font-medium text-[var(--app-iris)] underline underline-offset-2"
                      aria-label={`${item.label}: incomplete. Go to complete.`}
                    >
                      Fix
                    </Link>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppCard>
  );
}
