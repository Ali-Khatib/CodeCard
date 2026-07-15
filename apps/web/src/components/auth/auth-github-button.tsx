'use client';

import { FaGithub } from 'react-icons/fa';
import { motion, useReducedMotion } from 'motion/react';

type AuthGithubButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  pending?: boolean;
  label: string;
};

export function AuthGithubButton({
  onClick,
  disabled,
  pending = false,
  label,
}: AuthGithubButtonProps) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      aria-busy={pending}
      className="cc-auth-github-btn group w-full"
      whileHover={reduced || pending || disabled ? undefined : { backgroundColor: 'rgba(255,255,255,1)' }}
      whileTap={reduced || pending || disabled ? undefined : { scale: 0.997 }}
    >
      <span className="inline-flex items-center justify-center gap-2.5">
        {pending ? (
          <span
            className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[rgba(34,34,34,0.2)] border-t-ink motion-reduce:animate-none"
            aria-hidden
          />
        ) : (
          <FaGithub
            className="h-[18px] w-[18px] transition-transform duration-200 group-hover:-translate-y-px group-hover:opacity-100 opacity-90 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
            aria-hidden
          />
        )}
        <span>{label}</span>
      </span>
    </motion.button>
  );
}
