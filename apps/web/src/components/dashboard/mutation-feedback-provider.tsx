'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  createMutationFeedbackId,
  sanitizeMutationError,
  type MutationFeedbackItem,
  type MutationFeedbackVariant,
  MUTATION_FEEDBACK,
} from '@/lib/dashboard/mutation-feedback';

const SUCCESS_DURATION_MS = 5200;
const ERROR_DURATION_MS = 9000;
const DEDUPE_WINDOW_MS = 1200;
const MAX_VISIBLE = 3;

type MutationFeedbackApi = {
  notifySuccess: (message: string) => void;
  notifyError: (messageOrRaw?: unknown, fallback?: string) => void;
  dismiss: (id: string) => void;
};

const MutationFeedbackContext = createContext<MutationFeedbackApi | null>(null);

export function useMutationFeedback(): MutationFeedbackApi {
  const ctx = useContext(MutationFeedbackContext);
  if (!ctx) {
    throw new Error('useMutationFeedback must be used within MutationFeedbackProvider');
  }
  return ctx;
}

/** Optional hook for components that may render outside the dashboard shell. */
export function useOptionalMutationFeedback(): MutationFeedbackApi | null {
  return useContext(MutationFeedbackContext);
}

function FeedbackToast({
  item,
  onDismiss,
}: {
  item: MutationFeedbackItem;
  onDismiss: (id: string) => void;
}) {
  const isError = item.variant === 'error';
  return (
    <div
      className={`cc-mutation-toast cc-mutation-toast--${item.variant}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
      data-testid={`mutation-toast-${item.variant}`}
    >
      <p className="cc-mutation-toast__message">{item.message}</p>
      <button
        type="button"
        className="cc-mutation-toast__dismiss"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(item.id)}
      >
        Dismiss
      </button>
    </div>
  );
}

export function MutationFeedbackProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MutationFeedbackItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());
  const recentRef = useRef<{ key: string; at: number } | null>(null);

  const clearTimer = useCallback((id: string) => {
    const existing = timersRef.current.get(id);
    if (existing != null) {
      window.clearTimeout(existing);
      timersRef.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    [clearTimer],
  );

  const scheduleDismiss = useCallback(
    (id: string, variant: MutationFeedbackVariant) => {
      clearTimer(id);
      const duration = variant === 'error' ? ERROR_DURATION_MS : SUCCESS_DURATION_MS;
      const timer = window.setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timer);
    },
    [clearTimer, dismiss],
  );

  const push = useCallback(
    (variant: MutationFeedbackVariant, message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;

      const now = Date.now();
      const key = `${variant}:${trimmed}`;
      const recent = recentRef.current;
      if (recent && recent.key === key && now - recent.at < DEDUPE_WINDOW_MS) {
        return;
      }
      recentRef.current = { key, at: now };

      const item: MutationFeedbackItem = {
        id: createMutationFeedbackId(),
        variant,
        message: trimmed,
        createdAt: now,
      };

      setItems((prev) => {
        const next = [...prev, item];
        return next.slice(-MAX_VISIBLE);
      });
      scheduleDismiss(item.id, variant);
    },
    [scheduleDismiss],
  );

  const notifySuccess = useCallback(
    (message: string) => {
      push('success', message);
    },
    [push],
  );

  const notifyError = useCallback(
    (messageOrRaw?: unknown, fallback: string = MUTATION_FEEDBACK.genericFailure) => {
      push('error', sanitizeMutationError(messageOrRaw, fallback));
    },
    [push],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const api = useMemo(
    () => ({ notifySuccess, notifyError, dismiss }),
    [notifySuccess, notifyError, dismiss],
  );

  return (
    <MutationFeedbackContext.Provider value={api}>
      {children}
      <div className="cc-mutation-toast-region" aria-label="Dashboard notifications">
        {items.map((item) => (
          <FeedbackToast key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </MutationFeedbackContext.Provider>
  );
}
