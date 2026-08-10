'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getProfileLinkAria, resolveProfileLinkIcon } from '@/lib/icons/profile-links';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import { profileAvatarAltText } from '@/lib/profile/avatar-url';
import { getSavedProfilePreviewHref } from '@/lib/profile/profile-preview';
import { getPublicProfileLinkForClipboard } from '@/lib/sharing/qr';
import { AsyncActionButton } from '@/components/ui/async-action-button';
import { AppButton, AppMono } from './ui/dashboard-ui';

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
 * Compact visitor card on the Profile tab — what a shared link / QR opens.
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
  const previewHref = getSavedProfilePreviewHref({ slug, is_public: isPublic });
  const firstName = displayName.split(' ')[0] || displayName;
  const bioPreview = bio?.trim()
    ? bio.trim().length > 140
      ? `${bio.trim().slice(0, 137)}…`
      : bio.trim()
    : null;

  return (
    <section
      className="cc-profile-visitor-preview"
      aria-labelledby="profile-visitor-preview-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <AppMono>Visitor preview</AppMono>
          <h2
            id="profile-visitor-preview-heading"
            className="mt-1 text-[18px] font-medium tracking-[-0.02em] text-[var(--app-ink)]"
          >
            What people see
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--app-smoke)]">
            This is the face of your CodeCard when someone opens your shared link or scans your QR.
          </p>
        </div>
        <span
          className={`cc-app-badge shrink-0 ${
            isPublic ? 'cc-app-badge--mint' : 'cc-app-badge--blush'
          }`}
        >
          {isPublic ? 'Public' : 'Private'}
        </span>
      </div>

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

        <p className="mt-4 border-t border-[var(--app-border)] pt-3 text-[11px] leading-relaxed text-[var(--app-smoke)]">
          Full card also shows your projects and research — open the full preview to check
          everything before you share.
        </p>
      </div>

      {!isPublic ? (
        <p className="mt-3 text-[12px] leading-relaxed text-[var(--app-smoke)]">
          Profile is private. Publish it so shared links and QR codes work for visitors.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <AppButton variant="primary" href={previewHref}>
          Open full preview
        </AppButton>
        <AsyncActionButton
          variant="ghost"
          ariaLabel="Copy public link"
          successLabel={
            isPublic ? 'Public link copied' : 'Link copied — publish so visitors can open it'
          }
          onAction={async () => {
            const url = getPublicProfileLinkForClipboard(slug);
            if (!url) {
              throw new Error('Public profile link is unavailable.');
            }
            await navigator.clipboard.writeText(url);
          }}
        >
          Copy link
        </AsyncActionButton>
      </div>

      <p className="mt-3 text-[12px] text-[var(--app-smoke)]">
        Need the QR?{' '}
        <Link
          href="/dashboard#share"
          className="font-medium text-[var(--app-ink)] underline-offset-2 hover:underline"
        >
          Open share tools on Home
        </Link>
        .
      </p>
    </section>
  );
}
