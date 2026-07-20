'use client';

import { trackLinkClick } from '@/lib/analytics/link-click';
import { getProfileLinkAria, resolveProfileLinkIcon } from '@/lib/icons/profile-links';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';

export function PublicProfileSocialLinks({
  links,
  profileId,
}: {
  links: ProfileLinkItem[];
  profileId?: string;
}) {
  if (links.length === 0) return null;

  return (
    <nav className="mt-4 flex flex-wrap gap-2" aria-label="Profile links">
      {links.map((link) => {
        const Icon = resolveProfileLinkIcon(link.type);
        return (
          <a
            key={link.url + link.type}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={getProfileLinkAria(link.type, link.label)}
            className="cc-profile-identity-card__social"
            onClick={() => {
              trackLinkClick({
                profileId,
                linkCategory: link.type,
                kind: 'profile',
              });
            }}
          >
            <Icon className="text-sm" aria-hidden />
          </a>
        );
      })}
    </nav>
  );
}
