'use client';

import { MapPin, X } from 'lucide-react';
import { HeadlineRoles } from '@/components/profile/headline-roles';
import { PublicProfileSocialLinks } from '@/components/profile/public-profile-social-links';
import { Button } from '@/components/ui/button';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import { profileAvatarAltText } from '@/lib/profile/avatar-url';
import { toSafeProfileLinkItems } from '@/lib/profile/safe-profile-link-url';

export type ConnectionCallCardProps = {
  name: string;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  links?: ProfileLinkItem[];
  statusText: string;
  error?: string | null;
  busy?: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onLater?: () => void;
  onClose: () => void;
  acceptLabel?: string;
  declineLabel?: string;
  laterLabel?: string;
};

function initials(name: string): string {
  return (
    name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

/** Incoming connection as the person's CodeCard, with call actions pinned underneath. */
export function ConnectionCallCard({
  name,
  headline,
  bio,
  location,
  avatarUrl,
  links = [],
  statusText,
  error,
  busy = false,
  onAccept,
  onDecline,
  onLater,
  onClose,
  acceptLabel = 'Accept',
  declineLabel = 'Refuse',
  laterLabel = 'Decide later',
}: ConnectionCallCardProps) {
  const safeLinks = toSafeProfileLinkItems(links);
  const intro = bio?.trim() ?? '';

  return (
    <>
      <button
        type="button"
        className="cc-call-card__close"
        onClick={onClose}
        aria-label="Close notification"
        disabled={busy}
      >
        <X className="h-4 w-4" aria-hidden />
      </button>

      <div className="cc-call-card__scroll">
        <div className="cc-call-card__portrait">
          <div className="cc-call-card__frame">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={profileAvatarAltText(name)} />
            ) : (
              <span className="cc-call-card__fallback" aria-hidden>
                {initials(name)}
              </span>
            )}
          </div>
          <span className="cc-call-card__live">
            <span className="cc-call-card__dot" aria-hidden />
            Incoming
          </span>
        </div>

        <div className="cc-public-hero__panel cc-call-card__panel">
          <p className="cc-app-mono cc-public-hero__eyebrow">CodeCard</p>
          <p id="incoming-call-name" className="cc-public-hero__title cc-call-card__name">
            {name}
          </p>
          <HeadlineRoles headline={headline} />
          {location ? (
            <p className="cc-public-hero__place">
              <MapPin className="cc-public-hero__line-icon" aria-hidden />
              <span className="break-words">{location}</span>
            </p>
          ) : null}
          {intro ? <p className="cc-public-hero__bio cc-call-card__bio">{intro}</p> : null}
          {safeLinks.length > 0 ? (
            <div className="cc-public-hero__social cc-call-card__social">
              <PublicProfileSocialLinks links={safeLinks} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="cc-call-card__actions">
        <p className="cc-call-card__status">{statusText}</p>
        {error ? (
          <p className="text-[13px] text-[var(--app-error)]" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          size="lg"
          className="h-12 w-full bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={onAccept}
          disabled={busy}
        >
          {acceptLabel}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            size="lg"
            variant="destructive"
            className="h-11 w-full"
            onClick={onDecline}
            disabled={busy}
          >
            {declineLabel}
          </Button>
          {onLater ? (
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-11 w-full"
              onClick={onLater}
              disabled={busy}
            >
              {laterLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
}
