'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { AuthWordmark } from '@/components/auth/auth-wordmark';

const CARD_SHADOW = '0 22px 48px rgba(35, 35, 36, 0.14)';

/** Landing accent pair (reactor / specter). */
const PINK = '#f7bbe6';
const LAVENDER = '#c094e4';

const MEDIA = {
  hero: 'https://images.unsplash.com/photo-1522075469751-645b4e8881cd?auto=format&fit=crop&w=900&q=80',
  code: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80',
  desk: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=240&q=80',
};

function PhotoCard({
  src,
  className,
  priority = false,
  sizes,
  objectPosition = 'center',
}: {
  src: string;
  className: string;
  priority?: boolean;
  sizes: string;
  objectPosition?: string;
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
        className="object-cover"
        style={{ objectPosition }}
      />
    </div>
  );
}

function MiniProfileCard({ className }: { className: string }) {
  return (
    <div
      className={`flex flex-col justify-between overflow-hidden rounded-[28px] bg-white p-4 ${className}`}
      style={{ boxShadow: CARD_SHADOW }}
    >
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 overflow-hidden rounded-full bg-[#efeae3]">
          <Image src={MEDIA.avatar} alt="" fill sizes="44px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-[#17171a]">Alex Chen</p>
          <p className="truncate text-[12px] text-[#7a7876]">AI Engineer</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div
          className="h-2.5 w-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${LAVENDER} 0%, ${PINK} 100%)`,
          }}
        />
        <div className="h-2.5 w-[72%] rounded-full bg-[#f3ebe4]" />
        <div className="h-2.5 w-[48%] rounded-full bg-[#f3ebe4]" />
      </div>
      <div className="mt-4 flex gap-2">
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#17171a]"
          style={{ background: PINK }}
        >
          DevFlow
        </span>
        <span className="rounded-full bg-[#f3ebe4] px-2.5 py-1 text-[11px] font-semibold text-[#5c5956]">
          Pulse
        </span>
      </div>
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
            className="absolute left-[6%] top-[4%] z-[1] h-[64%] w-[48%]"
            initial={reduced ? false : { opacity: 0, y: 18, rotate: -4 }}
            animate={{ opacity: 1, y: 0, rotate: -7 }}
            transition={{ duration: reduced ? 0.01 : 0.55, ease: 'easeOut' }}
          >
            <PhotoCard
              src={MEDIA.code}
              className="absolute inset-0"
              sizes="260px"
              objectPosition="center"
            />
          </motion.div>

          <motion.div
            className="absolute right-[2%] top-[0%] z-[2] h-[68%] w-[54%]"
            initial={reduced ? false : { opacity: 0, y: 22, rotate: 3 }}
            animate={{ opacity: 1, y: 0, rotate: 5 }}
            transition={{ duration: reduced ? 0.01 : 0.6, delay: reduced ? 0 : 0.06, ease: 'easeOut' }}
          >
            <PhotoCard
              src={MEDIA.hero}
              className="absolute inset-0"
              priority
              sizes="300px"
              objectPosition="center top"
            />
          </motion.div>

          <motion.div
            className="absolute bottom-[4%] left-[10%] z-[3] h-[44%] w-[46%]"
            initial={reduced ? false : { opacity: 0, y: 20, rotate: 2 }}
            animate={{ opacity: 1, y: 0, rotate: 2 }}
            transition={{ duration: reduced ? 0.01 : 0.55, delay: reduced ? 0 : 0.1, ease: 'easeOut' }}
          >
            <MiniProfileCard className="absolute inset-0" />
          </motion.div>

          <motion.div
            className="absolute bottom-[8%] right-[6%] z-[3] h-[36%] w-[40%]"
            initial={reduced ? false : { opacity: 0, y: 16, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -3 }}
            transition={{ duration: reduced ? 0.01 : 0.5, delay: reduced ? 0 : 0.12, ease: 'easeOut' }}
          >
            <PhotoCard src={MEDIA.desk} className="absolute inset-0" sizes="200px" />
          </motion.div>

          <motion.div
            className="absolute bottom-[0%] right-[28%] z-[4] h-[84px] w-[84px] overflow-hidden rounded-full border-[3px] border-white bg-[#efeae3]"
            style={{ boxShadow: CARD_SHADOW }}
            initial={reduced ? false : { opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduced ? 0.01 : 0.45, delay: reduced ? 0 : 0.16, ease: 'easeOut' }}
          >
            <Image src={MEDIA.avatar} alt="" fill sizes="84px" className="object-cover" />
          </motion.div>

          <motion.div
            className="absolute left-[0%] top-[12%] z-[5] rounded-full px-3 py-1.5 text-[12px] font-semibold text-[#17171a]"
            style={{
              background: PINK,
              boxShadow: '0 10px 24px rgba(247, 187, 230, 0.45)',
            }}
            initial={reduced ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduced ? 0.01 : 0.4, delay: reduced ? 0 : 0.18 }}
          >
            +24 saves
          </motion.div>

          <motion.div
            className="absolute right-[-2%] top-[20%] z-[5] flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#17171a]"
            style={{ boxShadow: CARD_SHADOW }}
            initial={reduced ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.4, delay: reduced ? 0 : 0.2 }}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: LAVENDER }}
              aria-hidden
            />
            1.2k views
          </motion.div>

          <motion.div
            className="absolute bottom-[36%] right-[-4%] z-[5] flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-bold text-[#17171a]"
            style={{
              background: `linear-gradient(145deg, ${PINK} 0%, ${LAVENDER} 100%)`,
              boxShadow: CARD_SHADOW,
            }}
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
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(110deg, ${LAVENDER} 0%, ${PINK} 55%, ${LAVENDER} 100%)`,
            }}
          >
            you&apos;re proud of.
          </span>
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
