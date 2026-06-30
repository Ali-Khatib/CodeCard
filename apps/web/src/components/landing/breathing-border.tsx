import type { ReactNode } from 'react';

type BreathingBorderProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  /** Slower = calmer pulse */
  speed?: 'slow' | 'normal';
};

export function BreathingBorder({
  children,
  className = '',
  innerClassName = '',
  speed = 'normal',
}: BreathingBorderProps) {
  return (
    <div
      className={`cc-breathe ${speed === 'slow' ? 'cc-breathe--slow' : ''} ${className}`}
    >
      <div className={`cc-breathe__inner ${innerClassName}`}>{children}</div>
    </div>
  );
}
