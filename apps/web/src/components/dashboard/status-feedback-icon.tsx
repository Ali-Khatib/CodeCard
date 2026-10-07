'use client';

type StatusFeedbackIconProps = {
  variant: 'success' | 'error' | 'neutral';
  /** When true with success, render an animated happy face instead of a check. */
  happy?: boolean;
  size?: number;
  className?: string;
  label?: string;
};

/**
 * Compact animated status glyph for toasts and inline indicators.
 * Pure SVG + CSS — respects prefers-reduced-motion.
 */
export function StatusFeedbackIcon({
  variant,
  happy = false,
  size = 22,
  className = '',
  label,
}: StatusFeedbackIconProps) {
  const ariaLabel =
    label ??
    (variant === 'success'
      ? happy
        ? 'Success'
        : 'Complete'
      : variant === 'error'
        ? 'Error'
        : 'Status');

  const showHappy = variant === 'success' && happy;

  return (
    <span
      className={`cc-status-icon cc-status-icon--${variant}${showHappy ? ' cc-status-icon--happy' : ''}${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel}
      data-testid={`status-feedback-icon-${variant}${showHappy ? '-happy' : ''}`}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
        <circle className="cc-status-icon__ring" cx="12" cy="12" r="10" fill="none" />
        {showHappy ? (
          <>
            <circle className="cc-status-icon__eye cc-status-icon__eye--l" cx="9" cy="10" r="1.15" />
            <circle className="cc-status-icon__eye cc-status-icon__eye--r" cx="15" cy="10" r="1.15" />
            <path
              className="cc-status-icon__smile"
              d="M8.5 14c1 1.4 2.3 2.1 3.5 2.1S14.5 15.4 15.5 14"
              fill="none"
              strokeLinecap="round"
            />
          </>
        ) : variant === 'success' ? (
          <path
            className="cc-status-icon__check"
            d="M7.5 12.5l3 3 6-6.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : variant === 'error' ? (
          <>
            <path
              className="cc-status-icon__x cc-status-icon__x--a"
              d="M8.5 8.5l7 7"
              fill="none"
              strokeLinecap="round"
            />
            <path
              className="cc-status-icon__x cc-status-icon__x--b"
              d="M15.5 8.5l-7 7"
              fill="none"
              strokeLinecap="round"
            />
          </>
        ) : (
          <circle className="cc-status-icon__dot" cx="12" cy="12" r="2.5" />
        )}
      </svg>
    </span>
  );
}
