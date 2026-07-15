'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
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

  const formDelay = showCollage && !reduced ? 0.2 : 0;

  return (
    <div
      className={`cc-marketing-shell relative z-[1] min-h-screen overflow-x-hidden px-5 py-10 sm:px-6 md:py-14 ${
        showCollage ? 'bg-[#f3f1ec]' : 'bg-bone'
      }`}
      data-testid="auth-shell"
      data-auth-mode={mode}
    >
      <div
        className={`mx-auto grid w-full items-center gap-8 ${
          showCollage
            ? 'max-w-[1180px] lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-12 xl:gap-16'
            : 'max-w-[440px]'
        }`}
      >
        {showCollage ? (
          <div className="order-2 lg:order-1">
            <div className="hidden md:block">
              <AuthCollage />
            </div>
          </div>
        ) : null}

        <div className={`order-1 w-full ${showCollage ? 'lg:order-2' : ''}`}>
          <div className={`mb-6 ${showCollage ? 'text-left' : 'text-center'}`}>
            <AuthWordmark delay={0} />
          </div>

          <motion.div
            ref={panelRef}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.24, delay: formDelay, ease: 'easeOut' }}
            className="rounded-[22px] border border-[rgba(34,34,34,0.08)] bg-white p-6 shadow-[0_12px_40px_rgba(35,35,36,0.06)] sm:p-8"
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
  );
}
