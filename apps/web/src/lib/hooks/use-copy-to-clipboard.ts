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
        await navigator.clipboard.writeText(text);
      });
    },
    [run],
  );

  return { ...rest, run, copy };
}
