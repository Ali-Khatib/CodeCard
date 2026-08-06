'use client';

import type { ReactNode } from 'react';

/** Thin client wrapper so the dossier can receive pointer events without blocking LCP. */
export function ProofColdOpenClient({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
