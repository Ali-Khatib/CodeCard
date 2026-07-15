'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';

function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setFine(mq.matches);
    const onChange = () => setFine(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return fine;
}

function CollageCard({
  className,
  children,
  delay = 0,
  float = false,
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
  float?: boolean;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={
        reduced
          ? { opacity: 1 }
          : float
            ? { opacity: 1, y: [0, -3, 0] }
            : { opacity: 1 }
      }
      transition={
        reduced
          ? { duration: 0.01 }
          : float
            ? {
                opacity: { duration: 0.28, delay },
                y: { duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.4 },
              }
            : { duration: 0.28, delay }
      }
    >
      {children}
    </motion.div>
  );
}

export function AuthCollage() {
  const reduced = useReducedMotion();
  const finePointer = useFinePointer();
  const rootRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 22, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 120, damping: 22, mass: 0.4 });
  const layerA = useTransform(sx, (v) => (reduced || !finePointer ? 0 : v * 0.35));
  const layerB = useTransform(sy, (v) => (reduced || !finePointer ? 0 : v * 0.45));
  const layerC = useTransform(sx, (v) => (reduced || !finePointer ? 0 : -v * 0.25));

  useEffect(() => {
    if (reduced || !finePointer) return;
    const el = rootRef.current;
    if (!el) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 6;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 6;
        mx.set(Math.max(-3, Math.min(3, x)));
        my.set(Math.max(-3, Math.min(3, y)));
      });
    };
    const onLeave = () => {
      mx.set(0);
      my.set(0);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [finePointer, mx, my, reduced]);

  return (
    <div
      ref={rootRef}
      className="relative mx-auto hidden h-[520px] w-full max-w-[520px] select-none lg:block"
      aria-hidden="true"
      data-testid="auth-collage"
    >
      <motion.div
        className="absolute left-[8%] top-[6%] z-[2] w-[62%]"
        style={{ x: layerA, y: layerB }}
        initial={reduced ? false : { opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduced ? 0.01 : 0.32, delay: reduced ? 0 : 0.12, ease: 'easeOut' }}
      >
        <div className="group overflow-hidden rounded-[22px] border border-[rgba(34,34,34,0.08)] bg-white/90 p-4 shadow-[0_18px_50px_rgba(35,35,36,0.08)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-[3px] hover:shadow-[0_22px_56px_rgba(35,35,36,0.12)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(var(--accent-rgb),0.16)] text-[18px] font-medium text-ink">
              A
            </div>
            <div>
              <p className="text-[15px] font-medium tracking-[-0.02em] text-ink">Alex Rivera</p>
              <p className="text-[12px] text-smoke">Product engineer · San Francisco</p>
            </div>
          </div>
          <div className="mt-4 h-24 rounded-[14px] bg-gradient-to-br from-[rgba(192,148,228,0.28)] via-[rgba(247,187,230,0.22)] to-[rgba(250,218,193,0.35)]" />
          <p className="mt-3 text-[12px] text-smoke opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:opacity-100">
            View profile
          </p>
        </div>
      </motion.div>

      <CollageCard
        delay={0.2}
        float={!reduced && finePointer}
        className="absolute right-[4%] top-[14%] z-[3] w-[38%]"
      >
        <motion.div style={{ x: layerC }} className="group rounded-[18px] border border-[rgba(34,34,34,0.08)] bg-white/95 p-3 shadow-[0_14px_36px_rgba(35,35,36,0.08)]">
          <div className="relative mx-auto aspect-square w-full max-w-[120px] overflow-hidden rounded-[12px] bg-[rgba(34,34,34,0.04)] p-2">
            <div
              className="grid h-full w-full grid-cols-4 grid-rows-4 gap-[3px]"
              style={{
                backgroundImage:
                  'linear-gradient(#222 25%, transparent 25%), linear-gradient(#222 25%, transparent 25%), linear-gradient(transparent 75%, #222 75%), linear-gradient(transparent 75%, #222 75%)',
                backgroundSize: '22% 22%',
                backgroundPosition: '0 0, 50% 50%, 0 100%, 50% 0',
                opacity: 0.85,
              }}
            />
            <div className="pointer-events-none absolute inset-x-2 top-2 h-px translate-y-0 bg-[rgba(var(--accent-rgb),0)] transition-colors duration-200 group-hover:bg-[rgba(var(--accent-rgb),0.9)] group-hover:animate-[auth-qr-scan_1.6s_ease-in-out_infinite] motion-reduce:group-hover:animate-none" />
          </div>
          <p className="mt-2 text-center text-[11px] text-smoke opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:opacity-100">
            Ready to share
          </p>
        </motion.div>
      </CollageCard>

      <CollageCard delay={0.26} float={!reduced && finePointer} className="absolute bottom-[18%] left-[2%] z-[3] w-[48%]">
        <div className="group overflow-hidden rounded-[18px] border border-[rgba(34,34,34,0.08)] bg-white/95 p-3 shadow-[0_14px_36px_rgba(35,35,36,0.08)] transition-transform duration-300 hover:-translate-y-[2px] motion-reduce:hover:translate-y-0">
          <div className="flex gap-3">
            <div className="h-14 w-16 shrink-0 rounded-[10px] bg-gradient-to-br from-[#232324] to-[#5a4b6a] transition-transform duration-300 group-hover:translate-x-[1px] group-hover:-translate-y-[1px]" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">DevFlow Pipeline</p>
              <p className="mt-1 line-clamp-1 text-[11px] text-smoke opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:opacity-100">
                GitHub Actions · Preview envs
              </p>
            </div>
          </div>
        </div>
      </CollageCard>

      <CollageCard delay={0.32} className="absolute bottom-[6%] right-[10%] z-[2] w-[42%]">
        <div className="group rounded-[18px] border border-[rgba(34,34,34,0.08)] bg-white/95 p-3 shadow-[0_14px_36px_rgba(35,35,36,0.08)]">
          <p className="text-[11px] uppercase tracking-[0.08em] text-smoke">Research</p>
          <p className="mt-1 text-[13px] font-medium text-ink">Attention routing</p>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-smoke opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:opacity-100">
            <span className="inline-block h-3 w-2.5 rounded-[2px] border border-[rgba(34,34,34,0.2)] bg-[rgba(var(--accent-rgb),0.15)]" />
            Figure · PDF
          </p>
        </div>
      </CollageCard>
    </div>
  );
}
