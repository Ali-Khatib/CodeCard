'use client';

import type { ReactNode } from 'react';
import { AsyncActionButton } from './async-action-button';

type CopyLinkButtonProps = {
  /** Static text to copy. Ignored when `getText` is provided. */
  text?: string;
  /** Resolve copy text at click time (e.g. for window.location.origin). */
  getText?: () => string;
  children?: ReactNode;
  successLabel?: ReactNode;
  variant?: 'primary' | 'ghost' | 'soft';
  className?: string;
  block?: boolean;
  disabled?: boolean;
  successDuration?: number;
  ariaLabel?: string;
  showIcon?: boolean;
};

export function CopyLinkButton({
  text,
  getText,
  children = 'Copy link',
  successLabel = 'Copied',
  variant = 'ghost',
  className,
  block,
  disabled,
  successDuration = 2400,
  ariaLabel = 'Copy link',
  showIcon = true,
}: CopyLinkButtonProps) {
  return (
    <AsyncActionButton
      variant={variant}
      className={className}
      block={block}
      disabled={disabled || (!text && !getText)}
      successDuration={successDuration}
      ariaLabel={ariaLabel}
      showIcon={showIcon}
      successLabel={successLabel}
      onAction={async () => {
        const value = getText?.() ?? text ?? '';
        if (!value) return;
        await navigator.clipboard.writeText(value);
      }}
    >
      {children}
    </AsyncActionButton>
  );
}
