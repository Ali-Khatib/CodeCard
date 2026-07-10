'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion';
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
        width: Math.min(window.innerWidth * 0.94, 1180),
        height: Math.min(window.innerHeight * 0.86, 780),
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

function FakeQrCode() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-[28px] bg-[#fffaf4] p-8">
      <div className="rounded-[28px] border border-[rgba(35,35,36,0.08)] bg-white p-5 shadow-[0_22px_70px_rgba(35,35,36,0.12)]">
        <div
          className="grid h-[min(48vw,260px)] w-[min(48vw,260px)] gap-[3px]"
          style={{
            gridTemplateColumns: `repeat(${QR_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${QR_SIZE}, minmax(0, 1fr))`,
          }}
          aria-hidden
        >
          {Array.from({ length: QR_SIZE * QR_SIZE }).map((_, index) => (
            <span
              key={index}
              className="rounded-[2px]"
              style={{
                backgroundColor: isQrCellFilled(index) ? 'rgba(35,35,36,0.88)' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>
      <p className="mt-5 font-eyebrow text-[11px] uppercase tracking-[0.14em] text-[#8b7f76]">
        Scan to open CodeCard
      </p>
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

  const mediaWidthTarget = useTransform(scrollYProgress, [0, 0.3, 1], [320, expandedSize.width, expandedSize.width]);
  const mediaHeightTarget = useTransform(scrollYProgress, [0, 0.3, 1], [360, expandedSize.height, expandedSize.height]);
  const mediaWidth = useSpring(mediaWidthTarget, { stiffness: 120, damping: 28, mass: 0.45 });
  const mediaHeight = useSpring(mediaHeightTarget, { stiffness: 120, damping: 28, mass: 0.45 });
  const mediaY = useTransform(scrollYProgress, [0, 0.3], ['0px', '-10px']);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.28], [1, 0.18]);
  const titleXLeft = useTransform(scrollYProgress, [0, 0.3], ['0vw', '-22vw']);
  const titleXRight = useTransform(scrollYProgress, [0, 0.3], ['0vw', '22vw']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.2, 0.34], [1, 0.72, 0]);
  const contentOpacity = useTransform(scrollYProgress, [0.24, 0.34], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.24, 0.34], ['24px', '0px']);

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    onExpandChange?.(latest >= 0.3);
  });

  const firstWord = title ? title.split(' ')[0] : '';
  const restOfTitle = title ? title.split(' ').slice(1).join(' ') : '';

  return (
    <section ref={sectionRef} className={cn('relative min-h-[360vh] overflow-x-clip', className)}>
      <motion.div className="sticky top-0 flex min-h-[100dvh] items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0" style={{ opacity: bgOpacity }}>
          <Image
            src={bgImageSrc}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-[#fff3e7]/55 backdrop-blur-[1px]" />
        </motion.div>

        <motion.div
          className={cn(
            'pointer-events-none absolute inset-x-4 z-20 flex flex-col items-center gap-3 text-center',
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
          <div className="flex flex-col gap-1 font-display text-[clamp(2.5rem,8vw,7rem)] leading-[0.9] tracking-[-0.06em] text-[#232324]">
            <motion.span style={{ x: titleXLeft }}>{firstWord}</motion.span>
            <motion.span className="text-[#c094e4]" style={{ x: titleXRight }}>
              {restOfTitle}
            </motion.span>
          </div>
          {scrollToExpand && (
            <motion.p
              className="mt-2 font-sans text-[14px] font-medium text-[#6f6660]"
              style={{ x: titleXRight }}
            >
              {scrollToExpand}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          className="relative z-10 overflow-hidden rounded-[34px] border border-white/60 bg-white/50 shadow-[0_30px_100px_rgba(35,35,36,0.16)] backdrop-blur-xl"
          style={{ width: mediaWidth, height: mediaHeight, y: mediaY }}
        >
          {mediaType === 'qr' ? (
            <FakeQrCode />
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

          <motion.div
            className="absolute inset-0 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,250,244,0.92),rgba(255,250,244,0.98))] p-6 md:p-10"
            style={{ opacity: contentOpacity, y: contentY }}
          >
            {typeof children === 'function' ? children(scrollYProgress) : children}
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
