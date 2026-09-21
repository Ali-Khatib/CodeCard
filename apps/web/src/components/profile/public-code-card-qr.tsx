'use client';

import { useEffect, useState } from 'react';
import { generateProfileQrPreview, getPublicProfileLinkForClipboard } from '@/lib/sharing/qr';

/** Real public-CodeCard QR for visitor-facing surfaces. Encodes `/{slug}?source=qr`. */
export function PublicCodeCardQr({
  profileSlug,
  className = '',
}: {
  profileSlug: string;
  className?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const displayUrl = getPublicProfileLinkForClipboard(profileSlug);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setDataUrl(null);
    setQrUrl(null);

    void generateProfileQrPreview(profileSlug).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDataUrl(result.pngDataUrl);
      setQrUrl(result.url);
    });

    return () => {
      cancelled = true;
    };
  }, [profileSlug]);

  return (
    <div className={className}>
      {dataUrl && qrUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt={`QR code that opens this public CodeCard`}
          width={160}
          height={160}
          className="h-40 w-40 max-w-full bg-white"
        />
      ) : (
        <p className="text-[13px] text-[var(--app-smoke)]" role={error ? 'alert' : 'status'}>
          {error ?? 'Generating QR…'}
        </p>
      )}
      <p className="mt-3 max-w-full break-all text-[14px] text-[var(--app-ink,#1a191c)]">
        {qrUrl ?? displayUrl ?? `/${profileSlug}`}
      </p>
    </div>
  );
}
