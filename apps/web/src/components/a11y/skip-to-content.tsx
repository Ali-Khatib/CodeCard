import { MAIN_CONTENT_HREF } from '@/lib/a11y/main-content';

/**
 * WS12-T001 — First keyboard-focusable control in every document.
 * Pure anchor; works without JavaScript and does not change the route path.
 */
export function SkipToContentLink() {
  return (
    <a href={MAIN_CONTENT_HREF} className="cc-skip-link">
      Skip to main content
    </a>
  );
}
