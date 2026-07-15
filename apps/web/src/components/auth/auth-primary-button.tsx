'use client';

import { motion, useReducedMotion } from 'motion/react';

type AuthPrimaryButtonProps = {
  pending?: boolean;
  pendingLabel: string;
  idleLabel: string;
  disabled?: boolean;
};

function Spinner() {
  return (
    <span
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none"
      aria-hidden
    />
  );
}

export function AuthPrimaryButton({
  pending = false,
  pendingLabel,
  idleLabel,
  disabled,
}: AuthPrimaryButtonProps) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className="cc-auth-primary-btn relative w-full"
      whileHover={
        reduced || pending || disabled ? undefined : { y: -1, transition: { duration: 0.15 } }
      }
      whileTap={
        reduced || pending || disabled ? undefined : { scale: 0.995, y: 0, transition: { duration: 0.08 } }
      }
    >
      <span className="inline-flex items-center justify-center gap-2">
        {pending ? <Spinner /> : null}
        {pending ? pendingLabel : idleLabel}
      </span>
    </motion.button>
  );
}
