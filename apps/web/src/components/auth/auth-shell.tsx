'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { AuthCollage } from '@/components/auth/auth-collage';
import { AuthWordmark } from '@/components/auth/auth-wordmark';

export type AuthShellMode = 'sign-in' | 'sign-up' | 'other';

export function AuthShell({
  title,
  subtitle,
  mode = 'other',
  showCollage = false,
  children,
}: {
  title: string;
  subtitle?: string;
  mode?: AuthShellMode;
  showCollage?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const springX = useSpring(tiltX, { stiffness: 140, damping: 24, mass: 0.35 });
  const springY = useSpring(tiltY, { stiffness: 140, damping: 24, mass: 0.35 });

  useEffect(() => {
    if (mode !== 'sign-in' && mode !== 'sign-up') return;
    const previous = window.sessionStorage.getItem('cc-auth-mode');
    window.sessionStorage.setItem('cc-auth-mode', mode);
    // Focus the first field only when switching between sign-in and sign-up.
    if (!previous || previous === mode) return;

    const timer = window.setTimeout(() => {
      const first =
        panelRef.current?.querySelector<HTMLInputElement>(
          'input:not([type="hidden"]):not([disabled])',
        ) ?? null;
      first?.focus({ preventScroll: true });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [mode, pathname]);

  useEffect(() => {
    if (reduced || !showCollage) return;
    const panel = panelRef.current;
    if (!panel) return;

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!fine.matches) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = panel.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width - 0.5;
        const ny = (event.clientY - rect.top) / rect.height - 0.5;
        tiltX.set(Math.max(-2.5, Math.min(2.5, nx * 4)));
        tiltY.set(Math.max(-2.5, Math.min(2.5, ny * 4)));
      });
    };
    const onLeave = () => {
      tiltX.set(0);
      tiltY.set(0);
    };

    panel.addEventListener('pointermove', onMove);
    panel.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      panel.removeEventListener('pointermove', onMove);
      panel.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced, showCollage, tiltX, tiltY]);

  const formDelay = showCollage && !reduced ? 0.34 : reduced ? 0 : 0.18;

  return (
    <div
      className="cc-marketing-shell relative z-[1] min-h-screen overflow-x-hidden bg-bone px-5 py-12 sm:px-6 md:py-16"
      data-testid="auth-shell"
      data-auth-mode={mode}
    >
      <div
        className={`mx-auto grid w-full items-center gap-10 ${
          showCollage
            ? 'max-w-[1120px] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14'
            : 'max-w-[440px]'
        }`}
      >
        {showCollage ? (
          <div className="order-2 lg:order-1">
            <AuthCollage />
          </div>
        ) : null}

        <div className={`order-1 w-full ${showCollage ? 'lg:order-2' : ''}`}>
          <div className={`mb-7 ${showCollage ? 'text-left' : 'text-center'}`}>
            <AuthWordmark delay={0} />
          </div>

          <motion.div
            ref={panelRef}
            style={
              showCollage && !reduced
                ? { x: springX, y: springY }
                : undefined
            }
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.28, delay: formDelay, ease: 'easeOut' }}
            className="cc-auth-panel rounded-[24px] border border-[rgba(34,34,34,0.1)] bg-[rgba(255,255,255,0.88)] p-7 shadow-[0_18px_60px_rgba(35,35,36,0.07)] backdrop-blur-[10px] sm:p-8"
          >
            <div className="relative min-h-[72px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${mode}-${title}`}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{ duration: reduced ? 0.12 : 0.24, ease: 'easeOut' }}
                >
                  <h1 className="text-[26px] font-medium tracking-[-0.025em] text-ink">{title}</h1>
                  {subtitle ? (
                    <p className="mt-2 text-[15px] leading-relaxed text-smoke">{subtitle}</p>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <motion.div
              key={pathname}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.24, ease: 'easeOut' }}
              className="mt-7"
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
