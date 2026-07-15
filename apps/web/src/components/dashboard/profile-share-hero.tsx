'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AsyncActionButton } from '@/components/ui/async-action-button';
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';
import {
  buildCanonicalPublicProfileUrl,
  generateProfileQrDownload,
  generateProfileQrPreview,
} from '@/lib/sharing/qr';
import { downloadProfileQrPng } from '@/lib/sharing/qr-download';

const EASE = [0.22, 1, 0.36, 1] as const;

type ProfileShareHeroProps = {
  profileSlug?: string | null;
  isPublic?: boolean | null;
};

export function ProfileShareHero({
  profileSlug,
  isPublic = true,
}: ProfileShareHeroProps) {
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const reduced = useReducedMotion() ?? false;
  const statusId = useId();
  const downloadStatusId = useId();

  const canonical = buildCanonicalPublicProfileUrl(profileSlug);
  const displayUrl = canonical.ok
    ? canonical.url
    : profileSlug
      ? `/${profileSlug}`
      : 'Add a profile slug to share';
  const canShare = canonical.ok;

  const { copy, isLoading, isSuccess, isError, status } = useCopyToClipboard({
    successDuration: 2400,
  });

  useEffect(() => {
    if (!qrOpen) return;
    if (!canShare) {
      setQrDataUrl(null);
      setQrUrl(null);
      setQrError('A valid public profile slug is required before a QR code can be created.');
      return;
    }

    let cancelled = false;
    setQrLoading(true);
    setQrError(null);

    void generateProfileQrPreview(profileSlug).then((result) => {
      if (cancelled) return;
      setQrLoading(false);
      if (!result.ok) {
        setQrDataUrl(null);
        setQrUrl(null);
        setQrError(result.error);
        return;
      }
      setQrDataUrl(result.pngDataUrl);
      setQrUrl(result.url);
      setQrError(null);
    });

    return () => {
      cancelled = true;
    };
  }, [qrOpen, canShare, profileSlug]);

  const copyLink = async () => {
    if (!canonical.ok) return;
    await copy(canonical.url);
  };

  const copyAnnouncement = isSuccess
    ? 'Public link copied'
    : isError
      ? 'Could not copy public link'
      : '';

  return (
    <div className="cc-profile-share-hero">
      <div className="cc-profile-share-hero__grid">
        <motion.button
          type="button"
          onClick={copyLink}
          disabled={!canShare || isLoading}
          aria-busy={isLoading}
          aria-label="Copy public link"
          aria-describedby={statusId}
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
              transition={{
                duration: isLoading ? 1.1 : 0.5,
                ease: EASE,
                repeat: isLoading ? Infinity : 0,
              }}
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
                {isSuccess
                  ? 'Public link copied'
                  : isLoading
                    ? 'Copying…'
                    : 'Copy public link'}
              </motion.span>
            </AnimatePresence>
            <span className="cc-share-action__url break-all">{displayUrl}</span>
          </span>

          <span id={statusId} className="sr-only" role="status" aria-live="polite">
            {copyAnnouncement}
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
          aria-controls="profile-qr"
          aria-label={qrOpen ? 'Hide profile QR code' : 'Show profile QR code'}
          className={`cc-share-action cc-share-action--qr ${qrOpen ? 'cc-share-action--qr-open' : ''}`}
          whileHover={reduced ? undefined : { y: -4, scale: 1.01 }}
          whileTap={reduced ? undefined : { scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        >
          <span className="cc-share-action__glow cc-share-action__glow--mint" aria-hidden />
          <span className="cc-share-action__shine" aria-hidden />

          <span className="cc-share-action__icon-wrap cc-share-action__icon-wrap--qr" aria-hidden>
            {qrOpen && qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="" width={72} height={72} className="cc-share-qr-thumb" />
            ) : (
              <span className="cc-share-qr-thumb cc-share-qr-thumb--placeholder" />
            )}
            <span className="cc-share-action__qr-corners">
              <span />
              <span />
              <span />
              <span />
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

      {!isPublic && canShare ? (
        <p className="mt-4 text-[14px] leading-relaxed text-[var(--app-smoke)]" role="status">
          Your profile is private. The QR and link still point to your public URL, but visitors will
          not see it until you{' '}
          <Link href="/dashboard/profile" className="underline underline-offset-2">
            publish your profile
          </Link>
          .
        </p>
      ) : null}

      {!canShare ? (
        <p className="mt-4 text-[14px] leading-relaxed text-[var(--app-smoke)]" role="status">
          Add a valid profile slug before sharing.{' '}
          <Link href="/dashboard/profile" className="underline underline-offset-2">
            Edit profile
          </Link>
        </p>
      ) : null}

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
                {qrLoading ? (
                  <p className="text-[13px] text-[var(--app-smoke)]" role="status">
                    Generating QR…
                  </p>
                ) : qrDataUrl && qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt={`QR code for public CodeCard profile ${displayUrl}`}
                    width={280}
                    height={280}
                    className="cc-share-qr-image"
                  />
                ) : (
                  <p className="text-[13px] text-[var(--app-smoke)]" role="alert">
                    {qrError ?? 'QR preview unavailable.'}
                  </p>
                )}
              </div>
              <div>
                <p className="cc-app-mono">Your QR code</p>
                <p className="mt-2 text-[22px] font-medium tracking-[-0.02em] text-[var(--app-ink)]">
                  Scan anywhere you meet someone
                </p>
                <p className="mt-2 break-all text-[14px] text-[var(--app-smoke)]">
                  {qrUrl ?? displayUrl}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <AsyncActionButton
                    variant="primary"
                    successLabel="Downloaded"
                    ariaLabel="Download QR as PNG"
                    disabled={!canShare || qrLoading || !qrDataUrl}
                    onAction={async () => {
                      setDownloadError(null);
                      const generated = await generateProfileQrDownload(profileSlug);
                      if (!generated.ok) {
                        setDownloadError(generated.error);
                        throw new Error(generated.error);
                      }
                      if (qrUrl && generated.url !== qrUrl) {
                        const mismatch = 'Download QR URL does not match the preview.';
                        setDownloadError(mismatch);
                        throw new Error(mismatch);
                      }
                      const result = downloadProfileQrPng({
                        pngDataUrl: generated.pngDataUrl,
                        filename: generated.filename,
                      });
                      if (!result.ok) {
                        setDownloadError(result.error);
                        throw new Error(result.error);
                      }
                    }}
                  >
                    Download QR
                  </AsyncActionButton>
                </div>
                <p
                  id={downloadStatusId}
                  className="mt-2 text-[13px] text-[var(--app-smoke)]"
                  role="status"
                  aria-live="polite"
                >
                  {downloadError ?? ''}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
