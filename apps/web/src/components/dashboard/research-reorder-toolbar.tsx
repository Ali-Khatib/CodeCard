'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { reorderResearchAction } from '@/app/actions/research';

type ResearchReorderToolbarProps = {
  paperId: string;
  paperTitle: string;
  index: number;
  total: number;
  orderedPaperIds: string[];
  disabled?: boolean;
};

export function ResearchReorderToolbar({
  paperId: _paperId,
  paperTitle,
  index,
  total,
  orderedPaperIds,
  disabled = false,
}: ResearchReorderToolbarProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function move(direction: 'up' | 'down') {
    if (pending || disabled) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= total) return;

    const nextIds = [...orderedPaperIds];
    const [moved] = nextIds.splice(index, 1);
    nextIds.splice(targetIndex, 0, moved!);

    setError('');
    startTransition(async () => {
      const result = await reorderResearchAction(nextIds);
      if (result.error) {
        setError(result.error);
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className="flex flex-col gap-2"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-[var(--app-smoke)]" aria-live="polite">
          Position {index + 1} of {total}
        </span>
        <button
          type="button"
          className="cc-app-btn cc-app-btn--ghost h-8 px-3 text-[12px] disabled:opacity-50"
          disabled={pending || disabled || index === 0}
          aria-label={`Move research paper ${paperTitle} up from position ${index + 1}`}
          onClick={() => move('up')}
        >
          Move up
        </button>
        <button
          type="button"
          className="cc-app-btn cc-app-btn--ghost h-8 px-3 text-[12px] disabled:opacity-50"
          disabled={pending || disabled || index === total - 1}
          aria-label={`Move research paper ${paperTitle} down from position ${index + 1}`}
          onClick={() => move('down')}
        >
          Move down
        </button>
      </div>
      {error ? (
        <p className="text-[12px] text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {pending ? (
        <p className="text-[12px] text-[var(--app-smoke)]" role="status" aria-live="polite">
          Saving order…
        </p>
      ) : null}
    </div>
  );
}
