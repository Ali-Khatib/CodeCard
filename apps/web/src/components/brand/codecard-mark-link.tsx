'use client';

import Link from 'next/link';
import { CodeCardExpandingMark } from '@/components/brand/codecard-mark';
import '@/styles/codecard-mark.css';

/** CodeCard brand mark as a home link. */
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
      <CodeCardExpandingMark />
    </Link>
  );
}
