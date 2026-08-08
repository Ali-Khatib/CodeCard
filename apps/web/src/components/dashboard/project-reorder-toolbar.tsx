'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { reorderProjectsAction } from '@/lib/projects/project-order-actions';

type ProjectReorderToolbarProps = {
  projectId: string;
  index: number;
  total: number;
  orderedProjectIds: string[];
  disabled?: boolean;
};

export function ProjectReorderToolbar({
  projectId: _projectId,
  index,
  total,
  orderedProjectIds,
  disabled = false,
}: ProjectReorderToolbarProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function move(direction: 'up' | 'down') {
    if (pending || disabled) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= total) return;

    const nextIds = [...orderedProjectIds];
    const [moved] = nextIds.splice(index, 1);
    nextIds.splice(targetIndex, 0, moved!);

    setError('');
    startTransition(async () => {
      const result = await reorderProjectsAction(nextIds);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-[var(--app-smoke)]" aria-live="polite">
          Position {index + 1} of {total}
        </span>
        <button
          type="button"
          className="cc-btn-pill-ghost min-h-11 px-3 text-[12px]"
          disabled={pending || disabled || index === 0}
          aria-label={`Move project up from position ${index + 1}`}
          onClick={() => move('up')}
        >
          Move up
        </button>
        <button
          type="button"
          className="cc-btn-pill-ghost min-h-11 px-3 text-[12px]"
          disabled={pending || disabled || index === total - 1}
          aria-label={`Move project down from position ${index + 1}`}
          onClick={() => move('down')}
        >
          Move down
        </button>
      </div>
      {error ? (
        <p className="text-[12px] text-red-400" role="alert">
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
