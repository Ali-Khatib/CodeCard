import * as React from 'react';
import { cn } from './utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-ink',
        'placeholder:text-smoke focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
