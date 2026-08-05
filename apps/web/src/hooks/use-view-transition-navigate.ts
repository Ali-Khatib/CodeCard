'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { publicDemoProfileBasePath, publicDemoProjectHref } from '@/lib/marketing/demo-url';

const prefetched = new Set<string>();

export function prefetchHref(href: string, router?: { prefetch: (url: string) => void }) {
  if (prefetched.has(href)) return;
  prefetched.add(href);
  router?.prefetch(href);
}

export function useViewTransitionNavigate() {
  const router = useRouter();

  return useCallback(
    (url: string) => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduced && typeof document !== 'undefined' && 'startViewTransition' in document) {
        (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(
          () => router.push(url),
        );
        return;
      }
      router.push(url);
    },
    [router],
  );
}

export function prefetchProjectRoute(
  profileSlug: string,
  projectId: string,
  router?: { prefetch: (url: string) => void },
) {
  prefetchHref(publicDemoProjectHref(profileSlug, projectId), router);
}

export function prefetchProfileRoute(profileSlug: string, router?: { prefetch: (url: string) => void }) {
  prefetchHref(publicDemoProfileBasePath(profileSlug), router);
}
