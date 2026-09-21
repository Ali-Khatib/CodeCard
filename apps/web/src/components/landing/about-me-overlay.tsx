'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useSmoothScroll } from '@/components/motion/smooth-scroll-provider';
import { FOUNDER_ABOUT } from '@/lib/marketing/founder-about';
import { createFounderLanyardFaces } from '@/lib/marketing/founder-lanyard-faces';
import './about-me-overlay.css';

const Lanyard = dynamic(() => import('@/components/react-bits/lanyard/lanyard'), {
  ssr: false,
  loading: () => <div className="cc-about-lanyard" aria-hidden="true" />,
});

type AboutMeOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export function AboutMeOverlay({ open, onClose }: AboutMeOverlayProps) {
  const titleId = useId();
  const { pause, resume } = useSmoothScroll();
  const [faces, setFaces] = useState<{ front: string; back: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setFlipped(false);
      return;
    }
    let cancelled = false;
    const urls = { front: '', back: '' };
    void createFounderLanyardFaces().then((next) => {
      if (cancelled) {
        if (next.front.startsWith('blob:')) URL.revokeObjectURL(next.front);
        if (next.back.startsWith('blob:')) URL.revokeObjectURL(next.back);
        return;
      }
      urls.front = next.front;
      urls.back = next.back;
      setFaces(next);
    });
    return () => {
      cancelled = true;
      setFaces(null);
      if (urls.front.startsWith('blob:')) URL.revokeObjectURL(urls.front);
      if (urls.back.startsWith('blob:')) URL.revokeObjectURL(urls.back);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    pause();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      resume();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, pause, resume]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="cc-about-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      id="about-me-overlay"
    >
      <div className="cc-about-overlay__shade" onClick={onClose} />
      <div className="cc-about-overlay__drop">
        <button type="button" className="cc-about-overlay__close" onClick={onClose} autoFocus>
          Close
        </button>
        <div className="cc-about-overlay__stage">
          {faces ? (
            <>
              <button
                type="button"
                className={`cc-about-pass${flipped ? ' is-flipped' : ''}`}
                onClick={() => setFlipped((value) => !value)}
                aria-label="Flip lanyard card"
              >
                <span className="cc-about-pass__strap" aria-hidden="true" />
                <span className="cc-about-pass__clip" aria-hidden="true" />
                <span className="cc-about-pass__faces">
                  <img className="cc-about-pass__face cc-about-pass__face--front" src={faces.front} alt="" />
                  <img className="cc-about-pass__face cc-about-pass__face--back" src={faces.back} alt="" />
                </span>
              </button>
              <Lanyard
                className="cc-about-lanyard"
                position={[0, 0, 30]}
                gravity={[0, -40, 0]}
                fov={20}
                transparent
                frontImage={faces.front}
                backImage={faces.back}
                imageFit="cover"
                lanyardWidth={0.9}
                faceColor="#ffffff"
                emissive="#000000"
                metalness={0.08}
                lightPreset="neutral"
              />
            </>
          ) : (
            <div className="cc-about-lanyard" aria-hidden="true" />
          )}
        </div>
        <div className="cc-about-overlay__copy">
          <img src={FOUNDER_ABOUT.photoSrc} alt="" width={1} height={1} hidden />
          <h2 id={titleId}>{FOUNDER_ABOUT.displayName}</h2>
          <p>{FOUNDER_ABOUT.headline}</p>
          <p>{FOUNDER_ABOUT.degree}</p>
          <p>{FOUNDER_ABOUT.school}</p>
          <p>{FOUNDER_ABOUT.focus}</p>
          <p>{FOUNDER_ABOUT.publication}</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
