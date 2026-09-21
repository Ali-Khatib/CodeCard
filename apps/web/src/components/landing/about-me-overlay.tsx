'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useSmoothScroll } from '@/components/motion/smooth-scroll-provider';
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void createFounderLanyardFaces().then((next) => {
      if (!cancelled) setFaces(next);
    });
    return () => {
      cancelled = true;
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
            <Lanyard
              className="cc-about-lanyard"
              position={[0, 0, 22]}
              gravity={[0, -32, 0]}
              fov={18}
              transparent
              frontImage={faces.front}
              backImage={faces.back}
              imageFit="cover"
              lanyardWidth={0.9}
            />
          ) : (
            <div className="cc-about-lanyard" aria-hidden="true" />
          )}
        </div>
        <div className="cc-about-overlay__copy">
          <img src="/founder/ali-khatib.png" alt="" width={1} height={1} hidden />
          <h2 id={titleId}>ALI KHATIB</h2>
          <p>Software Engineer · AI/ML Researcher</p>
          <p>B.Sc. Software Engineering</p>
          <p>Bahçeşehir University · Istanbul</p>
          <p>AI / Machine Learning</p>
          <p>ASYU 2026 · Accepted Author</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
