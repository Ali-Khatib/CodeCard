'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAsyncAction } from '@/lib/hooks/use-async-action';

const EASE = [0.22, 1, 0.36, 1] as const;

type BtnVariant = 'primary' | 'ghost' | 'soft';

function btnClass(variant: BtnVariant, extra = '') {
  return cn(
    'cc-app-btn cc-async-action-btn',
    variant === 'primary' && 'cc-app-btn--primary',
    variant === 'ghost' && 'cc-app-btn--ghost',
    variant === 'soft' && 'cc-app-btn--soft',
    extra,
  );
}

function LoadingDot({ reduced }: { reduced: boolean }) {
  return (
    <motion.span
      className="cc-async-action-btn__loader"
      aria-hidden
      animate={reduced ? undefined : { opacity: [0.35, 1, 0.35] }}
      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function CheckmarkIcon({ reduced }: { reduced: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <motion.path
        d="M3.5 8.2l2.8 2.8 6.2-6.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0, opacity: 0.6 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.42, ease: EASE }}
      />
    </svg>
  );
}

type AsyncActionButtonProps = {
  children: ReactNode;
  successLabel?: ReactNode;
  onAction: () => Promise<void> | void;
  variant?: BtnVariant;
  className?: string;
  block?: boolean;
  disabled?: boolean;
  successDuration?: number;
  type?: 'button' | 'submit';
  ariaLabel?: string;
  showIcon?: boolean;
};

export function AsyncActionButton({
  children,
  successLabel,
  onAction,
  variant = 'ghost',
  className = '',
  block,
  disabled,
  successDuration = 2000,
  type = 'button',
  ariaLabel,
  showIcon = true,
}: AsyncActionButtonProps) {
  const reduced = useReducedMotion() ?? false;
  const { status, run, isLoading, isSuccess } = useAsyncAction({ successDuration });

  const label = isSuccess ? (successLabel ?? children) : children;

  return (
    <motion.button
      type={type}
      className={btnClass(variant, cn(block && 'cc-app-btn--block', className))}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      data-state={status}
      onClick={() => run(onAction)}
      whileTap={reduced || disabled ? undefined : { scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
    >
      {showIcon && (isLoading || isSuccess) && (
        <span className="cc-async-action-btn__icon-slot" aria-hidden>
          <AnimatePresence mode="wait" initial={false}>
            {isLoading ? (
              <motion.span
                key="loading"
                className="cc-async-action-btn__icon"
                initial={reduced ? false : { opacity: 0, scale: 0.82 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0, scale: 0.82 }}
                transition={{ duration: 0.18, ease: EASE }}
              >
                <LoadingDot reduced={reduced} />
              </motion.span>
            ) : isSuccess ? (
              <motion.span
                key="success"
                className="cc-async-action-btn__icon cc-async-action-btn__icon--success"
                initial={reduced ? false : { opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                <CheckmarkIcon reduced={reduced} />
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isSuccess ? 'success-label' : 'idle-label'}
          className="cc-async-action-btn__label"
          initial={reduced ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
