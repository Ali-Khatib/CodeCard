'use client';

import Link from 'next/link';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import { getProfileLinkAria, resolveProfileLinkIcon } from '@/lib/icons/profile-links';

interface ProfileStripProps {
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  links: ProfileLinkItem[];
}

/** Minimal profile header: avatar, role, icon-only links. */
export function ProfileStrip({ displayName, headline, avatarUrl, links }: ProfileStripProps) {
  return (
    <header className="cc-container flex scroll-mt-28 items-center gap-5 pb-6 pt-[108px] md:gap-6 md:pt-[120px]">
      <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[16px] border border-border/40 shadow-rim md:h-[80px] md:w-[80px]">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-moss text-2xl font-medium text-phosphor">
            {displayName.charAt(0)}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-4">
        {headline ? (
          <p className="text-[17px] font-medium leading-snug text-phosphor md:text-[19px]">{headline}</p>
        ) : (
          <p className="text-[17px] font-medium text-phosphor">{displayName}</p>
        )}

        {links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {links.map((link) => {
              const Icon = resolveProfileLinkIcon(link.type);
              return (
                <Link
                  key={link.url + link.type}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={getProfileLinkAria(link.type, link.label)}
                  className="flex h-10 w-10 items-center justify-center rounded-btn border border-stone/40 bg-moss/60 text-phosphor transition-colors hover:border-reactor/50 hover:bg-fern/40"
                >
                  <Icon className="text-xl" aria-hidden />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
