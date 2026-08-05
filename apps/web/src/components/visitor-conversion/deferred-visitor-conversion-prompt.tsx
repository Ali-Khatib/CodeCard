'use client';

import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const SitewideVisitorConversionPrompt = dynamic(
  () =>
    import('@/components/visitor-conversion/sitewide-visitor-conversion-prompt').then(
      (m) => ({ default: m.SitewideVisitorConversionPrompt }),
    ),
  { ssr: false },
);

/**
 * Defers the visitor conversion island (Supabase + search params) until after
 * first paint so public LCP is not blocked by that client graph.
 */
export function DeferredVisitorConversionPrompt({
  iosAppUrl,
  androidAppUrl,
}: {
  iosAppUrl?: string;
  androidAppUrl?: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setReady(true);
    };
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(enable, { timeout: 3500 });
    } else {
      timeoutId = setTimeout(enable, 1200);
    }
    return () => {
      cancelled = true;
      if (idleId != null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <SitewideVisitorConversionPrompt iosAppUrl={iosAppUrl} androidAppUrl={androidAppUrl} />
    </Suspense>
  );
}
