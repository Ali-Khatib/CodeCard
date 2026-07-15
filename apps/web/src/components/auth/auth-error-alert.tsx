'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export function AuthErrorAlert({
  id,
  message,
}: {
  id?: string;
  message: string | null | undefined;
}) {
  const reduced = useReducedMotion();
  const text = message?.trim() ? message : null;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {text ? (
        <motion.div
          key={text}
          id={id}
          role="alert"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -2 }}
          transition={{ duration: reduced ? 0.12 : 0.2, ease: 'easeOut' }}
          className="rounded-[10px] border border-[rgba(223,106,107,0.28)] bg-[rgba(223,106,107,0.06)] px-3 py-2.5 text-[14px] leading-snug text-[#b45353]"
        >
          {text}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
