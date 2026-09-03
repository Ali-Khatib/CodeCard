'use client';

import { trackLinkClick } from '@/lib/analytics/link-click';
import { getProfileLinkAria, resolveProfileLinkIcon } from '@/lib/icons/profile-links';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';

/** Pure black glyph on white chip — never inherit hero cream text. */
const ICON_INK = '#000000';

export function PublicProfileSocialLinks({
  links,
  profileId,
}: {
  links: ProfileLinkItem[];
  profileId?: string;
}) {
  if (links.length === 0) return null;

  return (
    <nav className="cc-public-social-row mt-4 flex flex-wrap gap-2.5" aria-label="Profile links">
      {links.map((link) => {
        const Icon = resolveProfileLinkIcon(link.type);
        return (
          <a
            key={link.url + link.type}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={getProfileLinkAria(link.type, link.label)}
            className="cc-public-social-chip"
            style={{ color: ICON_INK, backgroundColor: '#ffffff' }}
            onClick={() => {
              trackLinkClick({
                profileId,
                linkCategory: link.type,
                kind: 'profile',
              });
            }}
          >
            <Icon
              className="cc-public-social-chip__icon"
              size={22}
              color={ICON_INK}
              style={{ color: ICON_INK, fill: ICON_INK }}
              aria-hidden
            />
          </a>
        );
      })}
    </nav>
  );
}
