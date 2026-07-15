'use client';

import { useId, useState } from 'react';
import { HiOutlineClipboardDocument } from 'react-icons/hi2';
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';
import { normalizeCitationCopyText } from '@/lib/research/citation-copy';

type CitationCopyButtonProps = {
  citationText: string;
  className?: string;
  label?: string;
  compactLabel?: string;
  onCopied?: () => void;
};

export function CitationCopyButton({
  citationText,
  className = 'cc-app-btn cc-app-btn--ghost',
  label = 'Copy citation',
  compactLabel,
  onCopied,
}: CitationCopyButtonProps) {
  const statusId = useId();
  const [announcement, setAnnouncement] = useState('');
  const text = normalizeCitationCopyText(citationText);

  const { copy, isLoading, isSuccess, isError } = useCopyToClipboard({
    successDuration: 1800,
    onSuccess: () => {
      setAnnouncement('Citation copied');
      onCopied?.();
    },
    onError: () => {
      setAnnouncement("Couldn't copy citation");
    },
  });

  if (!text) {
    return null;
  }

  const buttonLabel = compactLabel ?? label;
  const visibleLabel = isSuccess
    ? 'Citation copied'
    : isError
      ? "Couldn't copy citation"
      : isLoading
        ? 'Copying…'
        : buttonLabel;

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        className={className}
        aria-label={label}
        aria-describedby={statusId}
        aria-busy={isLoading}
        disabled={isLoading}
        onClick={() => {
          void copy(text);
        }}
      >
        <HiOutlineClipboardDocument className="h-4 w-4" aria-hidden />
        {visibleLabel}
      </button>
      <span id={statusId} className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </span>
  );
}
