'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Cc2Mark } from './mark';

/**
 * The CodeCard device. HTML and CSS only: no screenshots of the product, so
 * it stays sharp at any size and takes the page's tokens.
 */
export function Phone({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`cc2-phone ${className}`.trim()}>
      <div className="cc2-phone__bezel">
        <div className="cc2-phone__screen">
          <div className="cc2-phone__status" aria-hidden>
            <span>9:41</span>
            <span className="cc2-phone__island" />
            <span className="cc2-phone__signal">
              <i />
              <i />
              <i />
            </span>
          </div>
          {children}
        </div>
        <span className="cc2-phone__glare" aria-hidden />
      </div>
    </div>
  );
}

/** Duotone poster so any project image sits inside the palette. */
export function Poster({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`cc2-poster ${className}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </div>
  );
}

export function ProfileScreen() {
  return (
    <div className="cc2-screen cc2-profile">
      <header className="cc2-profile__id">
        <span className="cc2-profile__avatar" aria-hidden>
          AC
        </span>
        <div>
          <p className="cc2-profile__name">Alex Chen</p>
          <p className="cc2-profile__role">AI engineer · Computer vision</p>
        </div>
      </header>
      <ul className="cc2-profile__links" aria-hidden>
        <li>GitHub</li>
        <li>LinkedIn</li>
        <li>Website</li>
        <li>Résumé</li>
      </ul>
      <p className="cc2-profile__label">Featured work</p>
      <article className="cc2-profile__card cc2-profile__card--lead">
        <Poster
          className="cc2-poster--emotion"
          src="/showcase/emotion/interface-preview.png"
          alt=""
        />
        <div className="cc2-profile__cardtext">
          <h3>Context-aware emotion recognition</h3>
          <p>From one face to the mood of a room.</p>
        </div>
      </article>
      <article className="cc2-profile__card">
        <div className="cc2-profile__thumb cc2-profile__thumb--scan" aria-hidden />
        <div className="cc2-profile__cardtext">
          <h3>Sentinel</h3>
          <p>Anomaly detection on live video.</p>
        </div>
      </article>
      <div className="cc2-profile__dock" aria-hidden>
        <span>Save to Circle</span>
        <i />
      </div>
    </div>
  );
}

export function TapScreen() {
  return (
    <div className="cc2-screen cc2-tap">
      <div className="cc2-tap__field" aria-hidden>
        <span className="cc2-tap__ring" style={{ ['--i' as string]: 0 } as CSSProperties} />
        <span className="cc2-tap__ring" style={{ ['--i' as string]: 1 } as CSSProperties} />
        <span className="cc2-tap__ring" style={{ ['--i' as string]: 2 } as CSSProperties} />
        <span className="cc2-tap__core">
          <Cc2Mark className="cc2-tap__mark" />
        </span>
      </div>
      <p className="cc2-tap__line">Hold near the card</p>
      <p className="cc2-tap__sub">or scan the code</p>
      <div className="cc2-tap__qr" aria-hidden>
        {Array.from({ length: 49 }, (_, i) => (
          <i key={i} data-on={QR_BITS[i] ? 'true' : 'false'} />
        ))}
      </div>
    </div>
  );
}

// A fixed 7x7 pattern. Decorative; it does not encode anything.
const QR_BITS = [
  1, 1, 1, 0, 1, 1, 1,
  1, 0, 1, 1, 1, 0, 1,
  1, 1, 1, 0, 0, 1, 1,
  0, 1, 0, 1, 1, 0, 0,
  1, 0, 1, 1, 0, 1, 1,
  1, 0, 1, 0, 1, 1, 0,
  1, 1, 1, 1, 0, 1, 1,
];

export function SavedScreen() {
  return (
    <div className="cc2-screen cc2-saved">
      <p className="cc2-saved__title">Saved to your Circle</p>
      <div className="cc2-saved__person">
        <span className="cc2-profile__avatar" aria-hidden>
          MR
        </span>
        <div>
          <p className="cc2-profile__name">Maya Rossi</p>
          <p className="cc2-profile__role">Product designer</p>
        </div>
      </div>
      <dl className="cc2-saved__facts">
        <div>
          <dt>Met at</dt>
          <dd>Web Summit, Lisbon</dd>
        </div>
        <div>
          <dt>How</dt>
          <dd>NFC tap</dd>
        </div>
        <div>
          <dt>Follow up</dt>
          <dd>Friday</dd>
        </div>
      </dl>
      <div className="cc2-saved__note">
        <p>Private note</p>
        <p>Wants the OCR demo. Send the repo.</p>
      </div>
    </div>
  );
}
