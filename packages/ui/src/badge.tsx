import * as React from 'react';
import { cn } from './utils';

export const Badge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border border-zinc-700 px-2.5 py-0.5 text-xs font-medium text-zinc-300',
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = 'Badge';
