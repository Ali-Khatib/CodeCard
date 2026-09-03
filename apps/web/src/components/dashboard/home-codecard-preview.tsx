'use client';

import Image from 'next/image';
import { parseHeadline } from '@/lib/profile/parse-headline';
import { profileAvatarAltText } from '@/lib/profile/avatar-url';
import { toSafeProfileLinkItems } from '@/lib/profile/safe-profile-link-url';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import { LIVE_DEMO_PROFILE_HREF } from '@/lib/marketing/demo-url';
import { getSavedProfilePreviewHref } from '@/lib/profile/profile-preview';
import { PublicProfileSocialLinks } from '@/components/profile/public-profile-social-links';
import { AppButton } from './ui/dashboard-ui';

type HomeCodeCardPreviewProps = {
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
 * Compact live CodeCard — the public overlapping portrait + dark identity card,
 * not the old flat profile preview.
 */
export function HomeCodeCardPreview({
  displayName,
  headline,
  bio,
  location,
  avatarUrl,
  slug,
  isPublic,
  links = [],
}: HomeCodeCardPreviewProps) {
  const viewHref =
    slug === 'demo' ? LIVE_DEMO_PROFILE_HREF : getSavedProfilePreviewHref({ slug, is_public: isPublic });
  const { role, company } = parseHeadline(headline ?? null);
  const safeLinks = toSafeProfileLinkItems(links);
  const intro = bio?.trim() || 'Add a short bio so visitors know who you are.';

  return (
    <aside className="cc-home-codecard" aria-labelledby="home-codecard-heading">
      <p className="cc-workspace-section__eyebrow" id="home-codecard-heading">
        Your CodeCard
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--app-smoke)]">
        Live preview of the card people open from your link or QR.
      </p>

      <div className="cc-home-codecard__stage cc-public-hero cc-app-profile-preview cc-app-profile-preview--hero">
        <div className="cc-public-hero__portrait">
          <div className="cc-public-hero__portrait-frame">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={profileAvatarAltText(displayName)}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 72vw, 280px"
              />
            ) : (
              <span
                className="flex h-full w-full items-center justify-center bg-[var(--app-bone)] text-4xl font-medium text-[var(--app-ink)]"
                aria-hidden
              >
                {displayName[0]}
              </span>
            )}
          </div>
        </div>

        <div className="cc-public-hero__panel cc-home-codecard__panel">
          <p className="cc-app-mono cc-public-hero__eyebrow">CodeCard</p>
          <p className="cc-public-hero__title mt-1 break-words text-[1.45rem] font-medium tracking-[-0.035em] md:text-[1.65rem]">
            {displayName}
          </p>
          {role ? (
            <p className="cc-public-hero__meta mt-1.5 break-words text-[13px]">
              {role}
              {company ? (
                <>
                  <span aria-hidden> · </span>
                  {company}
                </>
              ) : null}
            </p>
          ) : null}
          {location ? (
            <p className="cc-public-hero__meta mt-1 break-words text-[13px]">{location}</p>
          ) : null}
          <p className="cc-public-hero__bio mt-3 line-clamp-4 break-words text-[13px] leading-relaxed">
            {intro}
          </p>
          {safeLinks.length > 0 ? (
            <div className="cc-public-hero__social mt-4 [&>nav]:mt-0">
              <PublicProfileSocialLinks links={safeLinks} />
            </div>
          ) : null}
        </div>
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
      </div>
    </aside>
  );
}
