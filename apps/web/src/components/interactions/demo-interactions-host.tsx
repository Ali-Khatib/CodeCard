'use client';

import { ContentOpeningProvider } from '@/components/navigation/content-opening-transition';

/**
 * Demo interaction host — thin opening provider (overlay lazy).
 * Kept off the marketing Lenis/GSAP graph.
 */
export function DemoInteractionsHost({ children }: { children: React.ReactNode }) {
  return <ContentOpeningProvider>{children}</ContentOpeningProvider>;
}
