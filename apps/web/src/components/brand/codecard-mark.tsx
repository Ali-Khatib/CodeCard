/** Stylized overlapping-C CodeCard mark — SVG path, not lettering. */
export function CodeCardMark({
  className = 'cc-ed-mark-logo__mark',
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M20.76 6.93 L14.49 13.69 L12.28 18.24 L10.50 25.30 L10.43 37.71 L11.48 43.24 L14.43 50.37 L19.47 56.02 L22.85 57.99 L26.53 58.85 L36.24 57.68 L45.27 58.85 L52.58 56.94 L53.81 55.41 L53.75 42.44 L51.91 42.88 L50.31 49.57 L47.42 54.73 L42.81 56.45 L39.93 55.90 L39.19 54.30 L39.37 42.75 L37.59 42.57 L35.56 50.00 L34.33 50.25 L31.39 41.34 L30.59 31.20 L31.32 21.62 L34.03 13.32 L34.95 13.57 L36.92 20.33 L38.57 20.51 L38.76 8.41 L40.72 7.18 L43.98 7.18 L48.16 10.68 L51.42 20.08 L52.64 20.69 L53.44 20.02 L52.89 7.42 L50.74 6.01 L45.82 4.84 L40.36 4.90 L36.85 6.01 L32.06 4.90 L25.73 4.90 Z M26.84 7.06 L29.36 7.18 L31.45 8.22 L32.25 9.14 L32.18 9.64 L29.17 13.51 L27.08 17.56 L26.10 20.51 L25.00 26.29 L24.81 34.89 L25.30 39.68 L26.10 43.43 L27.15 46.56 L29.11 50.56 L32.31 54.49 L32.18 55.04 L31.14 55.90 L28.13 56.45 L25.00 55.84 L23.40 54.79 L21.19 52.52 L19.47 49.69 L17.50 44.47 L16.64 40.36 L16.09 32.55 L16.64 22.29 L18.42 15.53 L21.37 10.37 L23.77 8.22 Z"
      />
    </svg>
  );
}

/** Overlapping CC that expands into CodeCard on hover/focus. */
export function CodeCardExpandingMark() {
  return (
    <span className="cc-ed-mark-logo__inner" aria-hidden>
      <span className="cc-ed-mark-logo__c cc-ed-mark-logo__c--first">C</span>
      <span className="cc-ed-mark-logo__fill cc-ed-mark-logo__fill--left">ode</span>
      <span className="cc-ed-mark-logo__c cc-ed-mark-logo__c--second">C</span>
      <span className="cc-ed-mark-logo__fill cc-ed-mark-logo__fill--right">ard</span>
    </span>
  );
}
