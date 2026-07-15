'use client';

import { clampUploadPercent, type UploadStage } from '@/lib/storage/upload-progress';

type UploadProgressIndicatorProps = {
  stage: UploadStage;
  percent: number | null;
  label: string;
  testId?: string;
};

/**
 * Truthful progress only: determinate when byte progress exists; otherwise indeterminate.
 * Never invents percentages with timers.
 */
export function UploadProgressIndicator({
  stage,
  percent,
  label,
  testId,
}: UploadProgressIndicatorProps) {
  const determinate = stage === 'uploading' && typeof percent === 'number';
  const clamped = clampUploadPercent(percent);
  const showBar = stage === 'uploading' || stage === 'finalizing';

  if (!showBar && stage !== 'authorizing' && stage !== 'validating') {
    return null;
  }

  return (
    <div className="space-y-1" data-testid={testId}>
      <p className="text-[13px] text-[var(--app-smoke)]" aria-live="polite">
        {label}
      </p>
      {showBar ? (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--app-border)]"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          {...(determinate && clamped !== null
            ? { 'aria-valuenow': clamped, 'aria-valuetext': `${clamped}% transferred` }
            : {
                'aria-valuetext':
                  stage === 'finalizing' ? 'Finalizing upload' : 'Uploading, progress unknown',
              })}
        >
          <div
            className={
              determinate
                ? 'h-full rounded-full bg-[var(--app-ink)] transition-[width] duration-150 motion-reduce:transition-none'
                : 'h-full w-1/3 animate-pulse rounded-full bg-[var(--app-ink)] motion-reduce:animate-none motion-reduce:w-full motion-reduce:opacity-60'
            }
            style={determinate && clamped !== null ? { width: `${clamped}%` } : undefined}
          />
        </div>
      ) : null}
    </div>
  );
}
