'use client';

import dynamic from 'next/dynamic';
import { ContentOpeningProvider } from '@/components/navigation/content-opening-transition';

const DemoSectionProgress = dynamic(
  () =>
    import('@/components/interactions/demo-section-progress').then((m) => m.DemoSectionProgress),
  { ssr: false },
);

/**
 * Demo interaction host — thin opening provider (overlay lazy) + optional progress.
 * Kept off the marketing Lenis/GSAP graph.
 */
export function DemoInteractionsHost({ children }: { children: React.ReactNode }) {
  return (
    <ContentOpeningProvider>
      {children}
      <DemoSectionProgress />
    </ContentOpeningProvider>
  );
}
