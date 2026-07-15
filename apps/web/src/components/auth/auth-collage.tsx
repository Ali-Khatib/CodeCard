'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { AuthWordmark } from '@/components/auth/auth-wordmark';

const CARD_SHADOW = '0 18px 40px rgba(35, 35, 36, 0.12)';

function FloatCard({
  src,
  className,
  priority = false,
  sizes,
}: {
  src: string;
  className: string;
  priority?: boolean;
  sizes: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[28px] bg-white ${className}`}
      style={{ boxShadow: CARD_SHADOW }}
    >
      <Image
        src={src}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover object-top"
        unoptimized
      />
    </div>
  );
}

/** Facebook-style left stage: layered cards, soft chips, brand headline. */
export function AuthShowcaseStage() {
  const reduced = useReducedMotion();

  return (
    <div
      className="relative flex h-full min-h-[420px] w-full flex-col px-6 py-8 sm:px-10 lg:min-h-screen lg:px-12 lg:py-10"
      data-testid="auth-collage"
    >
      <div className="relative z-[3]">
        <AuthWordmark />
      </div>

      <div className="relative mx-auto mt-8 w-full max-w-[620px] flex-1 lg:mt-4">
        <div className="relative mx-auto h-[min(52vh,420px)] w-full max-w-[520px] lg:h-[min(58vh,480px)]">
          <motion.div
            className="absolute left-[8%] top-[6%] z-[1] h-[58%] w-[46%]"
            initial={reduced ? false : { opacity: 0, y: 18, rotate: -4 }}
            animate={{ opacity: 1, y: 0, rotate: -6 }}
            transition={{ duration: reduced ? 0.01 : 0.55, ease: 'easeOut' }}
          >
            <FloatCard src="/auth-demo/projects.webp" className="absolute inset-0" sizes="240px" />
          </motion.div>

          <motion.div
            className="absolute right-[4%] top-[2%] z-[2] h-[62%] w-[52%]"
            initial={reduced ? false : { opacity: 0, y: 22, rotate: 3 }}
            animate={{ opacity: 1, y: 0, rotate: 4 }}
            transition={{ duration: reduced ? 0.01 : 0.6, delay: reduced ? 0 : 0.06, ease: 'easeOut' }}
          >
            <FloatCard
              src="/auth-demo/home.webp"
              className="absolute inset-0"
              priority
              sizes="280px"
            />
          </motion.div>

          <motion.div
            className="absolute bottom-[6%] left-[18%] z-[3] h-[42%] w-[48%]"
            initial={reduced ? false : { opacity: 0, y: 20, rotate: 2 }}
            animate={{ opacity: 1, y: 0, rotate: 2 }}
            transition={{ duration: reduced ? 0.01 : 0.55, delay: reduced ? 0 : 0.1, ease: 'easeOut' }}
          >
            <FloatCard src="/auth-demo/research.webp" className="absolute inset-0" sizes="250px" />
          </motion.div>

          <motion.div
            className="absolute bottom-[2%] right-[12%] z-[4] h-[88px] w-[88px] overflow-hidden rounded-full border-[3px] border-white bg-[#efeae3]"
            style={{ boxShadow: CARD_SHADOW }}
            initial={reduced ? false : { opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduced ? 0.01 : 0.45, delay: reduced ? 0 : 0.16, ease: 'easeOut' }}
          >
            <Image
              src="/auth-demo/profile.webp"
              alt=""
              fill
              sizes="88px"
              className="object-cover object-[30%_18%]"
              unoptimized
            />
          </motion.div>

          <motion.div
            className="absolute left-[2%] top-[14%] z-[5] rounded-full bg-[#fff8f0] px-3 py-1.5 text-[12px] font-semibold text-[#e95a0b]"
            style={{ boxShadow: '0 10px 24px rgba(233, 90, 11, 0.18)' }}
            initial={reduced ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduced ? 0.01 : 0.4, delay: reduced ? 0 : 0.18 }}
          >
            +24 saves
          </motion.div>

          <motion.div
            className="absolute right-0 top-[22%] z-[5] flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#17171a]"
            style={{ boxShadow: CARD_SHADOW }}
            initial={reduced ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.4, delay: reduced ? 0 : 0.2 }}
          >
            <span className="inline-block h-2 w-2 rounded-full bg-[#e95a0b]" aria-hidden />
            1.2k views
          </motion.div>

          <motion.div
            className="absolute bottom-[28%] right-[2%] z-[5] flex h-11 w-11 items-center justify-center rounded-full bg-[#17171a] text-[15px] font-bold text-white"
            style={{ boxShadow: CARD_SHADOW }}
            initial={reduced ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduced ? 0.01 : 0.4, delay: reduced ? 0 : 0.22 }}
            aria-hidden
          >
            QR
          </motion.div>
        </div>
      </div>

      <motion.div
        className="relative z-[3] mt-auto max-w-[520px] pb-2 pt-6 lg:pb-6"
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.01 : 0.45, delay: reduced ? 0 : 0.12, ease: 'easeOut' }}
      >
        <h2 className="font-display text-[40px] font-medium leading-[1.05] tracking-[-0.04em] text-[#17171a] sm:text-[48px] lg:text-[54px]">
          Show the work{' '}
          <span className="text-[#e95a0b]">you&apos;re proud of.</span>
        </h2>
        <p className="mt-4 max-w-[36ch] text-[16px] leading-relaxed text-[#5c5956]">
          Projects, research, and a public card people can actually share.
        </p>
      </motion.div>
    </div>
  );
}

/** @deprecated Legacy export names kept for existing imports/tests. */
export function AuthDemoBackground() {
  return null;
}

export function AuthFeatureCopy() {
  return null;
}

export function AuthCollage() {
  return <AuthShowcaseStage />;
}
