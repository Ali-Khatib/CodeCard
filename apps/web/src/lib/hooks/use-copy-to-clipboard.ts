'use client';

import { useCallback } from 'react';
import { useAsyncAction } from './use-async-action';

type UseCopyToClipboardOptions = {
  successDuration?: number;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

export function useCopyToClipboard(options: UseCopyToClipboardOptions = {}) {
  const { run, ...rest } = useAsyncAction(options);

  const copy = useCallback(
    async (text: string) => {
      await run(async () => {
        const value = text.trim();
        if (!value) {
          throw new Error('Nothing to copy');
        }
        await navigator.clipboard.writeText(value);
      });
    },
    [run],
  );

  return { ...rest, run, copy };
}
