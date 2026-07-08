'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncActionStatus = 'idle' | 'loading' | 'success' | 'error';

type UseAsyncActionOptions = {
  successDuration?: number;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

export function useAsyncAction(options: UseAsyncActionOptions = {}) {
  const { successDuration = 2000, onSuccess, onError } = options;
  const [status, setStatus] = useState<AsyncActionStatus>('idle');
  const busyRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    busyRef.current = false;
    setStatus('idle');
  }, []);

  const run = useCallback(
    async (fn: () => Promise<void> | void) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setStatus('loading');

      try {
        await fn();
        setStatus('success');
        onSuccess?.();
      } catch (error) {
        setStatus('error');
        onError?.(error);
      } finally {
        busyRef.current = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setStatus('idle'), successDuration);
      }
    },
    [successDuration, onSuccess, onError],
  );

  return {
    status,
    run,
    reset,
    isIdle: status === 'idle',
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
}
