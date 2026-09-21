import Link from 'next/link';
import { MAIN_CONTENT_ID } from '@/lib/a11y/main-content';
import '@/styles/public-not-found.css';

const MARK_PATH =
  'M20.76 6.93 L14.49 13.69 L12.28 18.24 L10.50 25.30 L10.43 37.71 L11.48 43.24 L14.43 50.37 L19.47 56.02 L22.85 57.99 L26.53 58.85 L36.24 57.68 L45.27 58.85 L52.58 56.94 L53.81 55.41 L53.75 42.44 L51.91 42.88 L50.31 49.57 L47.42 54.73 L42.81 56.45 L39.93 55.90 L39.19 54.30 L39.37 42.75 L37.59 42.57 L35.56 50.00 L34.33 50.25 L31.39 41.34 L30.59 31.20 L31.32 21.62 L34.03 13.32 L34.95 13.57 L36.92 20.33 L38.57 20.51 L38.76 8.41 L40.72 7.18 L43.98 7.18 L48.16 10.68 L51.42 20.08 L52.64 20.69 L53.44 20.02 L52.89 7.42 L50.74 6.01 L45.82 4.84 L40.36 4.90 L36.85 6.01 L32.06 4.90 L25.73 4.90 Z M26.84 7.06 L29.36 7.18 L31.45 8.22 L32.25 9.14 L32.18 9.64 L29.17 13.51 L27.08 17.56 L26.10 20.51 L25.00 26.29 L24.81 34.89 L25.30 39.68 L26.10 43.43 L27.15 46.56 L29.11 50.56 L32.31 54.49 L32.18 55.04 L31.14 55.90 L28.13 56.45 L25.00 55.84 L23.40 54.79 L21.19 52.52 L19.47 49.69 L17.50 44.47 L16.64 40.36 L16.09 32.55 L16.64 22.29 L18.42 15.53 L21.37 10.37 L23.77 8.22 Z';

const CRACK_PATH = 'M41.4 5.2 L36.2 16.8 L39.8 24.1 L32.6 33.8 L36.4 41.6 L28.8 51.2 L32.2 59.6';
const LEFT_CLIP = 'M0 0 H42 L36.2 16.8 L39.8 24.1 L32.6 33.8 L36.4 41.6 L28.8 51.2 L32.2 64 H0 Z';
const RIGHT_CLIP = 'M64 0 H42 L36.2 16.8 L39.8 24.1 L32.6 33.8 L36.4 41.6 L28.8 51.2 L32.2 64 H64 Z';

function BrokenCodeCardMark() {
  return (
    <svg
      className="cc-404__mark-svg"
      viewBox="0 0 64 64"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <defs>
        <clipPath id="cc-404-clip-left">
          <path d={LEFT_CLIP} />
        </clipPath>
        <clipPath id="cc-404-clip-right">
          <path d={RIGHT_CLIP} />
        </clipPath>
      </defs>
      <g clipPath="url(#cc-404-clip-left)">
        <path fill="currentColor" fillRule="evenodd" d={MARK_PATH} />
      </g>
      <g className="cc-404__shard--right" clipPath="url(#cc-404-clip-right)">
        <path fill="currentColor" fillRule="evenodd" d={MARK_PATH} />
      </g>
      <path className="cc-404__crack" d={CRACK_PATH} />
    </svg>
  );
}

/**
 * Friendly public not-found UI.
 * Uses the same visitor-facing copy for missing and inaccessible content.
 */
export function PublicNotFoundView({
  heading = 'Page not found',
  message = 'This page is unavailable. It may have moved or never existed.',
}: {
  heading?: string;
  message?: string;
}) {
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="cc-404">
      <div className="cc-404__inner">
        <div className="cc-404__brand">
          <div className="cc-404__mark">
            <BrokenCodeCardMark />
          </div>
        </div>
        <p className="cc-404__code" aria-hidden="true">
          <span>4</span>
          <svg className="cc-404__zero" viewBox="0 0 72 88" fill="none">
            <ellipse cx="36" cy="44" rx="28" ry="36" stroke="currentColor" strokeWidth="5.5" />
            <circle cx="26.5" cy="38" r="3.1" fill="currentColor" />
            <circle cx="45.5" cy="38" r="3.1" fill="currentColor" />
            <path
              d="M27 58 C32.5 52.5 40.5 52.5 46 58"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
          </svg>
          <span>4</span>
        </p>
        <p className="cc-404__eyebrow">CodeCard</p>
        <h1 className="cc-404__title">{heading}</h1>
        <p className="cc-404__lede">{message}</p>
        <div className="cc-404__actions">
          <Link href="/" className="cc-404__btn cc-404__btn--primary">
            Back to CodeCard
          </Link>
          <Link href="/sign-up" className="cc-404__btn cc-404__btn--ghost">
            Create your CodeCard
          </Link>
        </div>
      </div>
    </main>
  );
}
