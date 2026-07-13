'use client';

import Link from 'next/link';
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
    <AppCard className="cc-profile-completion-card">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <AppMono>Profile completion</AppMono>
          <p className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
            Profile <CountUp value={percentage} />% complete
          </p>
          <p className="mt-1 text-[14px] text-[var(--app-smoke)]">
            {completedCount} of {totalCount} criteria complete
          </p>
        </div>
      </div>

      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--app-bone)]"
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
              <span className={item.complete ? 'text-[var(--app-ink)]' : 'text-[var(--app-smoke)]'}>
                {item.complete ? 'Complete' : 'Incomplete'}
              </span>
              {!item.complete ? (
                <Link
                  href={item.href}
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
    </AppCard>
  );
}
