'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AsyncActionButton } from '@/components/ui/async-action-button';
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';

const EASE = [0.22, 1, 0.36, 1] as const;

function QrPattern({ active }: { active: boolean }) {
  const reduced = useReducedMotion() ?? false;
  const cells = [
    1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1,
    0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0,
    1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1,
  ];

  return (
    <div className="cc-share-qr-pattern" aria-hidden>
      {cells.map((on, i) => (
        <motion.span
          key={i}
          className={on ? 'cc-share-qr-pattern__cell cc-share-qr-pattern__cell--on' : 'cc-share-qr-pattern__cell'}
          animate={
            active
              ? { opacity: on ? [0.4, 1, 0.85, 1] : 0.15, scale: on ? [0.9, 1, 1] : 1 }
              : { opacity: on ? 0.9 : 0.12, scale: 1 }
          }
          transition={{
            duration: 1.2,
            delay: (i % 11) * 0.02 + Math.floor(i / 11) * 0.03,
            repeat: active ? Infinity : 0,
            repeatType: 'reverse',
            ease: EASE,
          }}
        />
      ))}
      {!reduced && active && (
        <motion.span
          className="cc-share-qr-pattern__scan"
          animate={{ top: ['8%', '88%', '8%'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
}

export function ProfileShareHero({ profileSlug }: { profileSlug?: string | null }) {
  const [qrOpen, setQrOpen] = useState(false);
  const reduced = useReducedMotion() ?? false;
  const publicUrl = profileSlug ? `codecard.app/${profileSlug}` : 'codecard.app/you';

  const { copy, isLoading, isSuccess, status } = useCopyToClipboard({ successDuration: 2400 });

  const copyLink = async () => {
    if (!profileSlug) return;
    await copy(`${window.location.origin}/${profileSlug}`);
  };

  return (
    <div className="cc-profile-share-hero">
      <div className="cc-profile-share-hero__grid">
        <motion.button
          type="button"
          onClick={copyLink}
          disabled={!profileSlug || isLoading}
          aria-busy={isLoading}
          data-state={status}
          className="cc-share-action cc-share-action--link"
          whileHover={reduced ? undefined : { y: -4, scale: 1.01 }}
          whileTap={reduced ? undefined : { scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        >
          <span className="cc-share-action__glow cc-share-action__glow--iris" aria-hidden />
          <span className="cc-share-action__shine" aria-hidden />

          <span className="cc-share-action__icon-wrap">
            <motion.span
              className="cc-share-action__icon cc-share-action__icon--link"
              animate={
                isSuccess
                  ? { rotate: [0, -8, 0], scale: [1, 1.12, 1] }
                  : isLoading
                    ? { scale: [1, 0.94, 1] }
                    : { rotate: 0, scale: 1 }
              }
              transition={{ duration: isLoading ? 1.1 : 0.5, ease: EASE, repeat: isLoading ? Infinity : 0 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isLoading ? (
                  <motion.span
                    key="loading"
                    className="cc-async-action-btn__loader !h-[10px] !w-[10px]"
                    initial={reduced ? false : { opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduced ? undefined : { opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.18 }}
                  />
                ) : isSuccess ? (
                  <motion.svg
                    key="check"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    initial={reduced ? false : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduced ? undefined : { opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.22, ease: EASE }}
                  >
                    <motion.path
                      d="M5 12l5 5L19 7"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={reduced ? false : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.45, ease: EASE }}
                    />
                  </motion.svg>
                ) : (
                  <motion.svg
                    key="link"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    initial={reduced ? false : { opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduced ? undefined : { opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.18, ease: EASE }}
                  >
                    <path
                      d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.span>
          </span>

          <span className="cc-share-action__copy">
            <span className="cc-share-action__eyebrow">Share instantly</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isSuccess ? 'copied' : isLoading ? 'loading' : 'idle'}
                className="cc-share-action__title"
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                {isSuccess ? 'Link copied!' : isLoading ? 'Copying…' : 'Copy your link'}
              </motion.span>
            </AnimatePresence>
            <span className="cc-share-action__url">{publicUrl}</span>
          </span>

          <AnimatePresence>
            {isSuccess && (
              <motion.span
                className="cc-share-action__burst"
                initial={{ scale: 0.6, opacity: 0.8 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                aria-hidden
              />
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => setQrOpen((o) => !o)}
          aria-expanded={qrOpen}
          className={`cc-share-action cc-share-action--qr ${qrOpen ? 'cc-share-action--qr-open' : ''}`}
          whileHover={reduced ? undefined : { y: -4, scale: 1.01 }}
          whileTap={reduced ? undefined : { scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        >
          <span className="cc-share-action__glow cc-share-action__glow--mint" aria-hidden />
          <span className="cc-share-action__shine" aria-hidden />

          <span className="cc-share-action__icon-wrap cc-share-action__icon-wrap--qr">
            <QrPattern active={qrOpen} />
            <span className="cc-share-action__qr-corners" aria-hidden>
              <span /><span /><span /><span />
            </span>
          </span>

          <span className="cc-share-action__copy">
            <span className="cc-share-action__eyebrow">Meet in person</span>
            <span className="cc-share-action__title">
              {qrOpen ? 'Your QR is ready' : 'Get your QR code'}
            </span>
            <span className="cc-share-action__url">Tap to preview & download</span>
          </span>
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {qrOpen && (
          <motion.div
            id="profile-qr"
            className="cc-profile-share-qr-panel scroll-mt-24 overflow-hidden"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <div className="cc-profile-share-qr-panel__inner">
              <div className="cc-profile-share-qr-panel__code">
                <QrPattern active />
              </div>
              <div>
                <p className="cc-app-mono">Your QR code</p>
                <p className="mt-2 text-[22px] font-medium tracking-[-0.02em] text-[var(--app-ink)]">
                  Scan anywhere you meet someone
                </p>
                <p className="mt-2 text-[14px] text-[var(--app-smoke)]">{publicUrl}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <AsyncActionButton
                    variant="primary"
                    successLabel="Saved"
                    onAction={async () => {
                      await new Promise((r) => setTimeout(r, 500));
                    }}
                  >
                    Download PNG
                  </AsyncActionButton>
                  <AsyncActionButton
                    variant="ghost"
                    successLabel="Added"
                    onAction={async () => {
                      await new Promise((r) => setTimeout(r, 500));
                    }}
                  >
                    Add to wallet
                  </AsyncActionButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
