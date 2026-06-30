'use client';

import Image from 'next/image';
import { MagneticIconButton } from './magnetic-icon-button';
import {
  getProfileLinkAria,
  resolveProfileLinkIcon,
  type ProfileLinkItem,
} from '@/lib/icons/profile-links';

interface ProfileIdentityBarProps {
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  links: ProfileLinkItem[];
  accentColor?: string;
}

export function ProfileIdentityBar({
  displayName,
  headline,
  avatarUrl,
  links,
  accentColor = '#a78bfa',
}: ProfileIdentityBarProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-3 md:gap-4 md:px-6">
      {avatarUrl ? (
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-800">
          <Image src={avatarUrl} alt="" fill className="object-cover" sizes="44px" priority />
        </div>
      ) : (
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-zinc-400 ring-1 ring-zinc-800"
          aria-hidden
        >
          {displayName.charAt(0)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold tracking-tight text-zinc-50 md:text-lg">
          {displayName}
        </h1>
        {headline && (
          <p className="truncate text-xs text-zinc-500 md:text-sm">{headline}</p>
        )}
      </div>

      {links.length > 0 && (
        <nav className="flex shrink-0 items-center gap-1.5" aria-label="Profile links">
          {links.map((link) => {
            const Icon = resolveProfileLinkIcon(link.type);
            const aria = getProfileLinkAria(link.type, link.label);
            return (
              <MagneticIconButton
                key={link.url + link.type}
                href={link.url}
                ariaLabel={aria}
                accent={accentColor}
              >
                <Icon aria-hidden />
              </MagneticIconButton>
            );
          })}
        </nav>
      )}
    </header>
  );
}
