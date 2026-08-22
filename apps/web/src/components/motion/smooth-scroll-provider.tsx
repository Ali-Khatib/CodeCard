'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from 'react';
import type { LenisRef } from 'lenis/react';
import type Lenis from 'lenis';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';

type SmoothScrollApi = {
  /** Pause Lenis (dialogs, nested scroll locks). No-op when Lenis is disabled. */
  pause: () => void;
  /** Resume Lenis after pause. */
  resume: () => void;
  /** True when Lenis is actively driving the document scroll. */
  enabled: boolean;
};

const SmoothScrollContext = createContext<SmoothScrollApi>({
  pause: () => undefined,
  resume: () => undefined,
  enabled: false,
});

export function useSmoothScroll(): SmoothScrollApi {
  return useContext(SmoothScrollContext);
}

type SmoothScrollProviderProps = {
  children: ReactNode;
  /**
   * When false, children render without Lenis (dashboard / forms).
   * Marketing layout passes true.
   */
  enabled?: boolean;
};

type LenisRootProps = {
  root?: boolean;
  ref?: RefObject<LenisRef | null>;
  options?: {
    autoRaf?: boolean;
    lerp?: number;
    smoothWheel?: boolean;
    wheelMultiplier?: number;
    touchMultiplier?: number;
    syncTouch?: boolean;
  };
  children?: ReactNode;
};

type GsapRuntimeModule = typeof import('@/components/motion/gsap-runtime');

/**
 * Marketing-scoped Lenis + GSAP ScrollTrigger sync.
 * Native scroll first; Lenis/GSAP load only after idle paint when motion is allowed.
 * Disabled under prefers-reduced-motion (never downloads the runtime when practical).
 * Not mounted on dashboard routes in Phase 0.
 *
 * Cleanup is scoped to this provider: Lenis scroll listener, GSAP ticker callback,
 * and visibility handlers only. It never kills ScrollTriggers owned by child
 * components (those revert via their own useGSAP / gsap.context cleanup).
 */
export function SmoothScrollProvider({
  children,
  enabled = true,
}: SmoothScrollProviderProps) {
  const { canEnhanceMotion } = useMotionPreferences();
  const lenisRef = useRef<LenisRef>(null);
  const pauseCountRef = useRef(0);
  const tickerAttachedRef = useRef(false);
  const gsapRef = useRef<GsapRuntimeModule | null>(null);
  const [ReactLenis, setReactLenis] = useState<ComponentType<LenisRootProps> | null>(null);
  const [runtimeFailed, setRuntimeFailed] = useState(false);
  const [allowSmooth, setAllowSmooth] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 768px)');
    const sync = () => setAllowSmooth(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const wantsEnhancement = enabled && canEnhanceMotion && allowSmooth && !runtimeFailed;
  const active = Boolean(wantsEnhancement && ReactLenis);

  useEffect(() => {
    if (!wantsEnhancement) {
      setReactLenis(null);
      gsapRef.current = null;
      return;
    }

    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const boot = () => {
      void (async () => {
        try {
          const [{ ReactLenis: LenisRoot }, gsapMod] = await Promise.all([
            import('lenis/react'),
            import('@/components/motion/gsap-runtime'),
          ]);
          if (cancelled) return;
          gsapRef.current = gsapMod;
          setReactLenis(() => LenisRoot as ComponentType<LenisRootProps>);
        } catch {
          if (!cancelled) {
            setRuntimeFailed(true);
            setReactLenis(null);
            gsapRef.current = null;
          }
        }
      })();
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(boot, { timeout: 1800 });
    } else {
      timeoutId = setTimeout(boot, 200);
    }

    return () => {
      cancelled = true;
      if (idleId != null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [wantsEnhancement]);

  const pause = useCallback(() => {
    pauseCountRef.current += 1;
    lenisRef.current?.lenis?.stop();
  }, []);

  const resume = useCallback(() => {
    pauseCountRef.current = Math.max(0, pauseCountRef.current - 1);
    if (pauseCountRef.current === 0) {
      lenisRef.current?.lenis?.start();
    }
  }, []);

  const api = useMemo<SmoothScrollApi>(
    () => ({ pause, resume, enabled: active }),
    [pause, resume, active],
  );

  useEffect(() => {
    if (!active) return;
    const runtime = gsapRef.current;
    if (!runtime) return;

    const { ensureGsapPlugins, refreshScrollTrigger, ScrollTrigger, gsap } = runtime;
    ensureGsapPlugins();

    let cancelled = false;
    let attachedLenis: Lenis | null = null;
    let attempts = 0;

    const tick = (time: number) => {
      lenisRef.current?.lenis?.raf(time * 1000);
    };

    const onScroll = () => ScrollTrigger.update();

    const onVisibility = () => {
      const lenis = lenisRef.current?.lenis;
      if (!lenis) return;
      if (document.visibilityState === 'hidden') {
        lenis.stop();
      } else if (pauseCountRef.current === 0) {
        lenis.start();
      }
    };

    const attach = () => {
      if (cancelled) return;
      const lenis = lenisRef.current?.lenis;
      if (!lenis) {
        attempts += 1;
        if (attempts < 30) {
          window.requestAnimationFrame(attach);
        }
        return;
      }
      // Guard against duplicate attach if effect remount races.
      if (tickerAttachedRef.current && attachedLenis === lenis) return;

      attachedLenis = lenis;
      lenis.on('scroll', onScroll);
      if (!tickerAttachedRef.current) {
        gsap.ticker.add(tick);
        tickerAttachedRef.current = true;
      }
      gsap.ticker.lagSmoothing(0);
      document.addEventListener('visibilitychange', onVisibility);
      refreshScrollTrigger({ safe: true });
    };

    attach();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      attachedLenis?.off('scroll', onScroll);
      if (tickerAttachedRef.current) {
        gsap.ticker.remove(tick);
        tickerAttachedRef.current = false;
      }
      // Do NOT globally kill ScrollTriggers — child useGSAP contexts own their triggers.
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const runtime = gsapRef.current;
    if (!runtime) return;
    const onPageShow = () => runtime.refreshScrollTrigger({ safe: true });
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [active]);

  if (!active || !ReactLenis) {
    return (
      <SmoothScrollContext.Provider value={api}>{children}</SmoothScrollContext.Provider>
    );
  }

  return (
    <SmoothScrollContext.Provider value={api}>
      <ReactLenis
        root
        ref={lenisRef}
        options={{
          autoRaf: false,
          lerp: 0.1,
          smoothWheel: true,
          wheelMultiplier: 0.85,
          touchMultiplier: 0.92,
          syncTouch: false,
        }}
      >
        {children}
      </ReactLenis>
    </SmoothScrollContext.Provider>
  );
}
