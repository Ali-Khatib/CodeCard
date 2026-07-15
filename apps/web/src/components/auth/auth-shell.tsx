'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AuthDemoBackground, AuthFeatureCopy } from '@/components/auth/auth-collage';
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
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (mode !== 'sign-in' && mode !== 'sign-up') return;
    const previous = window.sessionStorage.getItem('cc-auth-mode');
    window.sessionStorage.setItem('cc-auth-mode', mode);
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

  if (!showCollage) {
    return (
      <div
        className="cc-marketing-shell relative z-[1] flex min-h-screen items-center justify-center bg-bone px-5 py-12"
        data-testid="auth-shell"
        data-auth-mode={mode}
      >
        <div className="w-full max-w-[440px]">
          <div className="mb-6 text-center">
            <AuthWordmark />
          </div>
          <div
            ref={panelRef}
            className="rounded-[22px] border border-[rgba(34,34,34,0.08)] bg-white p-6 shadow-[0_12px_40px_rgba(35,35,36,0.06)] sm:p-8"
          >
            <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#17171a]">{title}</h1>
            {subtitle ? (
              <p className="mt-2 text-[15px] leading-relaxed text-[#6f6c69]">{subtitle}</p>
            ) : null}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="cc-marketing-shell relative z-[1] min-h-screen overflow-hidden bg-[#f3f1ec]"
      data-testid="auth-shell"
      data-auth-mode={mode}
    >
      <AuthDemoBackground index={slideIndex} onIndexChange={setSlideIndex} />

      <div className="relative z-[2] mx-auto flex min-h-screen w-full max-w-[1240px] flex-col px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="mb-6">
          <AuthWordmark />
        </div>

        <div className="grid flex-1 grid-cols-1 items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] lg:gap-12">
          <div className="order-2 flex flex-col justify-end pb-4 lg:order-1 lg:pb-10">
            <div className="hidden md:block">
              <AuthFeatureCopy index={slideIndex} onIndexChange={setSlideIndex} />
            </div>
          </div>

          <div className="order-1 flex items-start justify-center lg:order-2 lg:items-center lg:justify-end">
            <motion.div
              ref={panelRef}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.01 : 0.24, ease: 'easeOut' }}
              className="w-full max-w-[420px] rounded-[22px] border border-[rgba(34,34,34,0.08)] bg-white/95 p-6 shadow-[0_18px_50px_rgba(35,35,36,0.12)] backdrop-blur-sm sm:p-8"
            >
              <div className="relative min-h-[64px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${mode}-${title}`}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                    transition={{ duration: reduced ? 0.1 : 0.2, ease: 'easeOut' }}
                  >
                    <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#17171a]">
                      {title}
                    </h1>
                    {subtitle ? (
                      <p className="mt-2 text-[15px] leading-relaxed text-[#6f6c69]">{subtitle}</p>
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </div>

              <motion.div
                key={pathname}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0.1 : 0.2, ease: 'easeOut' }}
                className="mt-6"
              >
                {children}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
