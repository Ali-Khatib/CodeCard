'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ComponentType,
  type MouseEvent,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import {
  CONTENT_OPENING_FAILSAFE_MS,
  CONTENT_OPENING_MIN_MS,
  contentOpeningMatchesPath,
  contentOpeningTitle,
  resolveContentOpeningKind,
  shouldInterceptContentOpeningClick,
  type ContentOpeningKind,
  type ContentOpeningState,
} from '@/lib/navigation/content-opening';

type ContentOpeningContextValue = {
  opening: ContentOpeningState | null;
  beginOpening: (input: {
    kind: ContentOpeningKind;
    title?: string | null;
    href: string;
  }) => void;
  navigateWithOpening: (input: {
    kind: ContentOpeningKind;
    title?: string | null;
    href: string;
  }) => void;
  clearOpening: () => void;
};

const ContentOpeningContext = createContext<ContentOpeningContextValue | null>(null);

type OverlayProps = {
  opening: ContentOpeningState;
  reducedMotion: boolean | null;
};

export function ContentOpeningProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [opening, setOpening] = useState<ContentOpeningState | null>(null);
  const [Overlay, setOverlay] = useState<ComponentType<OverlayProps> | null>(null);
  const startedAtRef = useRef(0);
  const pendingHrefRef = useRef<string | null>(null);
  const clearTimerRef = useRef<number | null>(null);

  const clearOpening = useCallback(() => {
    if (clearTimerRef.current != null) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    pendingHrefRef.current = null;
    setOpening(null);
  }, []);

  const finishOpening = useCallback(() => {
    const elapsed = Date.now() - startedAtRef.current;
    const wait = Math.max(0, CONTENT_OPENING_MIN_MS - elapsed);
    if (clearTimerRef.current != null) {
      window.clearTimeout(clearTimerRef.current);
    }
    clearTimerRef.current = window.setTimeout(() => {
      pendingHrefRef.current = null;
      setOpening(null);
      clearTimerRef.current = null;
    }, wait);
  }, []);

  const beginOpening = useCallback(
    (input: { kind: ContentOpeningKind; title?: string | null; href: string }) => {
      if (pendingHrefRef.current === input.href && opening) return;
      startedAtRef.current = Date.now();
      pendingHrefRef.current = input.href;
      setOpening({
        kind: input.kind,
        title: contentOpeningTitle(input.kind, input.title),
        href: input.href,
      });
    },
    [opening],
  );

  const navigateWithOpening = useCallback(
    (input: { kind: ContentOpeningKind; title?: string | null; href: string }) => {
      if (pendingHrefRef.current === input.href && opening) return;
      beginOpening(input);
      try {
        router.push(input.href);
      } catch {
        clearOpening();
      }
    },
    [beginOpening, clearOpening, opening, router],
  );

  useEffect(() => {
    if (!opening || !pendingHrefRef.current) return;
    if (!contentOpeningMatchesPath(pendingHrefRef.current, pathname)) return;
    finishOpening();
  }, [finishOpening, opening, pathname]);

  useEffect(() => {
    if (!opening) return;
    const failsafe = window.setTimeout(() => {
      clearOpening();
    }, CONTENT_OPENING_FAILSAFE_MS);
    return () => window.clearTimeout(failsafe);
  }, [clearOpening, opening]);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current != null) {
        window.clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!opening || Overlay) return;
    let cancelled = false;
    void import('./content-opening-overlay').then((mod) => {
      if (!cancelled) setOverlay(() => mod.ContentOpeningOverlayLazy);
    });
    return () => {
      cancelled = true;
    };
  }, [opening, Overlay]);

  const value = useMemo(
    () => ({
      opening,
      beginOpening,
      navigateWithOpening,
      clearOpening,
    }),
    [opening, beginOpening, navigateWithOpening, clearOpening],
  );

  return (
    <ContentOpeningContext.Provider value={value}>
      {children}
      {opening ? (
        Overlay ? (
          <Overlay opening={opening} reducedMotion={reducedMotion} />
        ) : (
          <div
            className="cc-content-opening"
            role="status"
            aria-live="polite"
            aria-busy="true"
            data-testid="content-opening-fallback"
          >
            <div className="cc-content-opening__panel">
              <span className="cc-content-opening__dot" aria-hidden />
              <p className="cc-content-opening__headline">
                {opening.kind === 'project' ? 'Opening project' : 'Opening research'}
              </p>
              <p className="cc-content-opening__title">{opening.title}</p>
            </div>
          </div>
        )
      ) : null}
    </ContentOpeningContext.Provider>
  );
}

export function useContentOpeningOptional() {
  return useContext(ContentOpeningContext);
}

export function useContentOpening() {
  const ctx = useContentOpeningOptional();
  if (!ctx) {
    throw new Error('useContentOpening must be used within ContentOpeningProvider');
  }
  return ctx;
}

type ContentOpeningLinkProps = Omit<
  ComponentProps<typeof Link>,
  'href' | 'onClick'
> & {
  href: string;
  kind?: ContentOpeningKind;
  itemTitle?: string | null;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

/**
 * Internal Link that shows the shared opening overlay for project/research routes.
 * Ctrl/Cmd/middle-click and external destinations keep native browser behavior.
 */
export function ContentOpeningLink({
  href,
  kind,
  itemTitle,
  onClick,
  children,
  ...rest
}: ContentOpeningLinkProps) {
  const ctx = useContentOpeningOptional();
  const resolvedKind = kind ?? resolveContentOpeningKind(href);

  return (
    <Link
      href={href}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (!ctx || !resolvedKind) return;
        if (!shouldInterceptContentOpeningClick(event)) return;
        if (event.defaultPrevented) return;
        event.preventDefault();
        ctx.navigateWithOpening({
          kind: resolvedKind,
          title: itemTitle,
          href,
        });
      }}
    >
      {children}
    </Link>
  );
}
