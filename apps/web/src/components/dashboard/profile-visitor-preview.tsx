'use client';

import Image from 'next/image';
import { useEffect, useId, useState } from 'react';
import { getProfileLinkAria, resolveProfileLinkIcon } from '@/lib/icons/profile-links';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import { profileAvatarAltText } from '@/lib/profile/avatar-url';
import { LIVE_DEMO_PROFILE_HREF } from '@/lib/marketing/demo-url';
import { getSavedProfilePreviewHref } from '@/lib/profile/profile-preview';
import { generateProfileQrPreview } from '@/lib/sharing/qr';
import { AppButton } from './ui/dashboard-ui';

type ProfileVisitorPreviewProps = {
  displayName: string;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  slug: string;
  isPublic: boolean;
  links?: ProfileLinkItem[];
};

/**
 * Live CodeCard preview on the Profile tab — edit left, see card right.
 */
export function ProfileVisitorPreview({
  displayName,
  headline,
  bio,
  location,
  avatarUrl,
  slug,
  isPublic,
  links = [],
}: ProfileVisitorPreviewProps) {
  const viewHref =
    slug === 'demo'
      ? LIVE_DEMO_PROFILE_HREF
      : getSavedProfilePreviewHref({ slug, is_public: isPublic });
  const firstName = displayName.split(' ')[0] || displayName;
  const bioPreview = bio?.trim()
    ? bio.trim().length > 140
      ? `${bio.trim().slice(0, 137)}…`
      : bio.trim()
    : null;

  const qrPanelId = useId();
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    if (!qrOpen) return;

    let cancelled = false;
    setQrLoading(true);
    setQrError(null);

    void generateProfileQrPreview(slug).then((result) => {
      if (cancelled) return;
      setQrLoading(false);
      if (!result.ok) {
        setQrDataUrl(null);
        setQrUrl(null);
        setQrError(result.error);
        return;
      }
      setQrDataUrl(result.pngDataUrl);
      setQrUrl(result.url);
      setQrError(null);
    });

    return () => {
      cancelled = true;
    };
  }, [qrOpen, slug]);

  return (
    <section className="cc-profile-visitor-preview" aria-labelledby="profile-your-codecard-heading">
      <h2 id="profile-your-codecard-heading" className="cc-app-mono">
        Your CodeCard
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--app-smoke)]">
        This is what people see when they open your profile.
      </p>

      <div className="cc-profile-visitor-preview__card mt-4">
        <div className="flex gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white bg-[var(--app-bone)] shadow-sm">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={profileAvatarAltText(displayName)}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-medium">
                {firstName[0]}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[18px] font-semibold tracking-[-0.03em] text-[var(--app-ink)]">
              {displayName}
            </p>
            <p className="mt-0.5 truncate text-[13px] text-[var(--app-smoke)]">@{slug}</p>
            {headline ? (
              <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[var(--app-smoke)]">
                {headline}
              </p>
            ) : (
              <p className="mt-1 text-[13px] font-medium text-[var(--app-iris)]">Add a headline</p>
            )}
            {location ? (
              <p className="mt-1 truncate text-[12px] text-[var(--app-smoke)]">{location}</p>
            ) : null}
          </div>
        </div>

        {bioPreview ? (
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--app-ink)]">{bioPreview}</p>
        ) : (
          <p className="mt-3 text-[13px] font-medium text-[var(--app-iris)]">
            Add a short bio so visitors know who you are.
          </p>
        )}

        {links.length > 0 ? (
          <nav className="mt-3 flex flex-wrap gap-2" aria-label="Public profile links">
            {links.map((link) => {
              const Icon = resolveProfileLinkIcon(link.type);
              return (
                <span
                  key={`${link.type}-${link.url}`}
                  className="cc-profile-identity-card__social"
                  title={getProfileLinkAria(link.type, link.label)}
                >
                  <Icon className="text-sm" aria-hidden />
                </span>
              );
            })}
          </nav>
        ) : (
          <p className="mt-3 text-[12px] text-[var(--app-smoke)]">No public links yet.</p>
        )}
      </div>

      {!isPublic ? (
        <p className="mt-3 text-[12px] leading-relaxed text-[var(--app-smoke)]">
          Profile is private. Publish it so shared links and QR codes work for visitors.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <AppButton variant="primary" href={viewHref}>
          View CodeCard ↗
        </AppButton>
        <button
          type="button"
          className="cc-app-btn cc-app-btn--ghost"
          aria-expanded={qrOpen}
          aria-controls={qrPanelId}
          onClick={() => setQrOpen((open) => !open)}
        >
          QR Code
        </button>
      </div>

      {qrOpen ? (
        <div
          id={qrPanelId}
          className="mt-4 rounded-[16px] border border-[var(--app-border)] bg-[var(--app-paper)] p-4"
          role="region"
          aria-label="Profile QR code"
        >
          <p className="cc-app-mono">Scan to open</p>
          <div className="mt-3 flex flex-col items-start gap-3">
            {qrLoading ? (
              <p className="text-[13px] text-[var(--app-smoke)]">Generating QR…</p>
            ) : qrDataUrl && qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- runtime data URL from qrcode
              <img
                src={qrDataUrl}
                alt={`QR code for ${displayName}`}
                width={160}
                height={160}
                className="rounded-md border border-[var(--app-border)] bg-white"
              />
            ) : (
              <p className="text-[13px] text-[var(--app-smoke)]">
                {qrError ?? 'QR preview unavailable.'}
              </p>
            )}
            {qrUrl ? (
              <p className="max-w-full break-all text-[12px] text-[var(--app-smoke)]">{qrUrl}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
