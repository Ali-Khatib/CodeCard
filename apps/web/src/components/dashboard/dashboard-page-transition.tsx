'use client';

import { motion, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';

export function DashboardPageTransition({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const pathname = usePathname();

  if (reduced) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
