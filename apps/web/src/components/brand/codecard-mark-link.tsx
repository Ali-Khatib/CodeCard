'use client';

import Link from 'next/link';
import '@/styles/codecard-mark.css';

/**
 * Overlapping CC mark as a link — expands to “CodeCard” on hover (same as landing/auth).
 */
export function CodeCardMarkLink({
  href,
  className = '',
  'aria-label': ariaLabel = 'CodeCard home',
  testId,
}: {
  href: string;
  className?: string;
  'aria-label'?: string;
  testId?: string;
}) {
  return (
    <Link
      href={href}
      className={`cc-ed-mark-logo cc-auth-mark cc-instant-press ${className}`.trim()}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      <span className="cc-ed-mark-logo__inner" aria-hidden>
        <span className="cc-ed-mark-logo__c cc-ed-mark-logo__c--first">C</span>
        <span className="cc-ed-mark-logo__fill cc-ed-mark-logo__fill--left">ode</span>
        <span className="cc-ed-mark-logo__c cc-ed-mark-logo__c--second">C</span>
        <span className="cc-ed-mark-logo__fill cc-ed-mark-logo__fill--right">ard</span>
      </span>
    </Link>
  );
}
