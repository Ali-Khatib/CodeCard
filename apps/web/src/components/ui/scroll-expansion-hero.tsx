'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { cn } from '@/lib/utils';

interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image' | 'qr';
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  className?: string;
  onExpandChange?: (expanded: boolean) => void;
  children?: ReactNode | ((scrollProgress: MotionValue<number>) => ReactNode);
}

const QR_SIZE = 17;

function useExpandedMediaSize() {
  const [size, setSize] = useState({ width: 1080, height: 680 });

  useEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return size;
}

function isQrFinder(row: number, col: number, startRow: number, startCol: number) {
  const r = row - startRow;
  const c = col - startCol;
  if (r < 0 || r > 6 || c < 0 || c > 6) return false;
  return r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
}

function isQrCellFilled(index: number) {
  const row = Math.floor(index / QR_SIZE);
  const col = index % QR_SIZE;
  if (
    isQrFinder(row, col, 0, 0) ||
    isQrFinder(row, col, 0, QR_SIZE - 7) ||
    isQrFinder(row, col, QR_SIZE - 7, 0)
  ) {
    return true;
  }

  return (
    (row * 11 + col * 7) % 13 < 5 ||
    (row + col) % 5 === 0 ||
    (row % 4 === 1 && col % 3 === 0)
  );
}

function FakeQrCode({ progress }: { progress: MotionValue<number> }) {
  const scanY = useTransform(progress, [0, 0.26], ['6%', '94%']);
  const scanOpacity = useTransform(progress, [0, 0.04, 0.2, 0.3], [0.15, 1, 1, 0]);
  const glowOpacity = useTransform(progress, [0, 0.12, 0.28], [0.35, 0.7, 0.15]);
  const frameScale = useTransform(progress, [0, 0.28], [1, 1.06]);
  const gridOpacity = useTransform(progress, [0, 0.08, 0.2], [0.4, 0.75, 1]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[28px] bg-[#fffaf4] p-8">
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: glowOpacity,
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(192,148,228,0.28), transparent 62%)',
        }}
        aria-hidden
      />

      <motion.div
        className="relative rounded-[28px] border border-[rgba(35,35,36,0.08)] bg-white p-5 shadow-[0_22px_70px_rgba(35,35,36,0.12)]"
        style={{ scale: frameScale }}
      >
        <motion.div
          className="relative grid h-[min(48vw,280px)] w-[min(48vw,280px)] gap-[3px] overflow-hidden"
          style={{
            opacity: gridOpacity,
            gridTemplateColumns: `repeat(${QR_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${QR_SIZE}, minmax(0, 1fr))`,
          }}
          aria-hidden
        >
          {Array.from({ length: QR_SIZE * QR_SIZE }).map((_, index) => {
            const filled = isQrCellFilled(index);
            const row = Math.floor(index / QR_SIZE);
            return (
              <span
                key={index}
                className="cc-hiw-qr-cell rounded-[2px]"
                style={{
                  backgroundColor: filled ? 'rgba(35,35,36,0.88)' : 'transparent',
                  animationDelay: filled ? `${row * 28}ms` : undefined,
                }}
              />
            );
          })}

          <motion.div
            className="pointer-events-none absolute inset-x-0 h-[18%]"
            style={{
              top: scanY,
              opacity: scanOpacity,
              background:
                'linear-gradient(180deg, transparent, rgba(192,148,228,0.55), rgba(255,255,255,0.85), rgba(192,148,228,0.45), transparent)',
              boxShadow: '0 0 28px rgba(192,148,228,0.45)',
            }}
          />
        </motion.div>

        <p className="mt-4 text-center font-eyebrow text-[11px] uppercase tracking-[0.16em] text-[#8b7f76]">
          Scanning…
        </p>
      </motion.div>
    </div>
  );
}

export default function ScrollExpandMedia({
  mediaType = 'image',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  textBlend,
  className,
  onExpandChange,
  children,
}: ScrollExpandMediaProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const expandedSize = useExpandedMediaSize();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const mediaWidthTarget = useTransform(
    scrollYProgress,
    [0, 0.22, 1],
    [420, expandedSize.width, expandedSize.width],
  );
  const mediaHeightTarget = useTransform(
    scrollYProgress,
    [0, 0.22, 1],
    [460, expandedSize.height, expandedSize.height],
  );
  const mediaWidth = useSpring(mediaWidthTarget, { stiffness: 100, damping: 26, mass: 0.4 });
  const mediaHeight = useSpring(mediaHeightTarget, { stiffness: 100, damping: 26, mass: 0.4 });
  const mediaY = useTransform(scrollYProgress, [0, 0.22], ['0px', '-6px']);
  const mediaRadius = useTransform(scrollYProgress, [0, 0.2, 0.28], ['36px', '18px', '0px']);
  const mediaBorderOpacity = useTransform(scrollYProgress, [0, 0.2, 0.28], [1, 0.35, 0]);
  const mediaBorderColor = useTransform(
    mediaBorderOpacity,
    (opacity) => `rgba(255,255,255,${opacity * 0.65})`,
  );
  const bgOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0.08]);
  const titleXLeft = useTransform(scrollYProgress, [0, 0.22], ['0vw', '-28vw']);
  const titleXRight = useTransform(scrollYProgress, [0, 0.22], ['0vw', '28vw']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.14, 0.26], [1, 0.65, 0]);
  const mediaOpacity = useTransform(scrollYProgress, [0, 0.18, 0.3], [1, 0.55, 0]);
  const contentOpacity = useTransform(scrollYProgress, [0.26, 0.36], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.26, 0.36], ['40px', '0px']);
  const contentScale = useTransform(scrollYProgress, [0.26, 0.36], [0.94, 1]);
  const bloomOpacity = useTransform(scrollYProgress, [0.2, 0.26, 0.34], [0, 0.7, 0]);

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    onExpandChange?.(latest >= 0.22);
  });

  const firstWord = title ? title.split(' ')[0] : '';
  const restOfTitle = title ? title.split(' ').slice(1).join(' ') : '';

  return (
    <section ref={sectionRef} className={cn('relative min-h-[480vh] overflow-x-clip', className)}>
      <motion.div className="sticky top-0 flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4">
        <motion.div className="absolute inset-0" style={{ opacity: bgOpacity }}>
          <Image
            src={bgImageSrc}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-[#fff3e7]/6 backdrop-blur-[1.5px]" />
        </motion.div>

        <motion.div
          className={cn(
            'relative z-20 mb-6 flex max-w-[920px] flex-col items-center gap-2 text-center',
            textBlend ? 'mix-blend-difference' : 'mix-blend-normal',
          )}
          style={{ opacity: titleOpacity }}
        >
          {date && (
            <motion.p
              className="font-eyebrow text-[11px] uppercase tracking-[0.14em] text-[#8b7f76]"
              style={{ x: titleXLeft }}
            >
              {date}
            </motion.p>
          )}
          <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1 font-display text-[clamp(2.8rem,7vw,6.2rem)] leading-[0.92] tracking-[-0.06em] text-[#232324]">
            <motion.span style={{ x: titleXLeft }}>{firstWord}</motion.span>
            <motion.span className="text-[#c094e4]" style={{ x: titleXRight }}>
              {restOfTitle}
            </motion.span>
          </div>
          {scrollToExpand && (
            <motion.p
              className="mt-1 font-sans text-[14px] font-medium text-[#6f6660]"
              style={{ x: titleXRight }}
            >
              {scrollToExpand}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          className="relative z-10 overflow-hidden border border-white/60 bg-[#fffaf4] shadow-[0_30px_100px_rgba(35,35,36,0.16)] backdrop-blur-xl"
          style={{
            width: mediaWidth,
            height: mediaHeight,
            y: mediaY,
            borderRadius: mediaRadius,
            borderColor: mediaBorderColor,
          }}
        >
          <motion.div className="absolute inset-0" style={{ opacity: mediaOpacity }}>
            {mediaType === 'qr' ? (
              <FakeQrCode progress={scrollYProgress} />
            ) : mediaType === 'video' ? (
              <video
                src={mediaSrc}
                poster={posterSrc}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="h-full w-full object-cover"
                controls={false}
              />
            ) : (
              <Image src={mediaSrc} alt={title ?? 'Expanded media'} fill className="object-cover" sizes="92vw" />
            )}
          </motion.div>

          <motion.div
            className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.95),rgba(192,148,228,0.35)_35%,transparent_70%)]"
            style={{ opacity: bloomOpacity }}
            aria-hidden
          />

          <motion.div
            className="absolute inset-0 overflow-hidden bg-[#f7f1ea] p-5 md:p-8"
            style={{ opacity: contentOpacity, y: contentY, scale: contentScale }}
          >
            {typeof children === 'function' ? children(scrollYProgress) : children}
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
