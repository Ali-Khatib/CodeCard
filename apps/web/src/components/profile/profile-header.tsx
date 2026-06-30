'use client';

import { TechLogoRow } from '@/components/profile/tech-logo-row';
import { MagneticIconButton } from '@/components/profile/magnetic-icon-button';
import { getProfileLinkAria, resolveProfileLinkIcon } from '@/lib/icons/profile-links';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import { TYPE } from '@/lib/design/tokens';

interface ProfileHeaderProps {
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  links: ProfileLinkItem[];
  technologies: string[];
  accentColor?: string;
}

export function ProfileHeader({
  displayName,
  headline,
  avatarUrl,
  links,
  technologies,
  accentColor = '#8B83FF',
}: ProfileHeaderProps) {
  return (
    <header
      className="cc-container pb-10 pt-8 md:pb-12 md:pt-12"
      style={{ '--profile-accent': accentColor } as React.CSSProperties}
    >
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-5 md:gap-6">
          <div className="h-[96px] w-[96px] shrink-0 overflow-hidden rounded-lg border border-border bg-surface md:h-[120px] md:w-[120px]">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-surface text-3xl font-semibold text-text-secondary">
                {displayName.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 pt-1">
            <h1 className={TYPE.profileName}>{displayName}</h1>
            {headline && (
              <p className={`mt-2 ${TYPE.profileRole} text-text-secondary`}>{headline}</p>
            )}
          </div>
        </div>

        {links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {links.map((link) => {
              const Icon = resolveProfileLinkIcon(link.type);
              return (
                <MagneticIconButton
                  key={link.url + link.type}
                  href={link.url}
                  ariaLabel={getProfileLinkAria(link.type, link.label)}
                  accent={accentColor}
                  size="lg"
                >
                  <Icon className="text-xl" aria-hidden />
                </MagneticIconButton>
              );
            })}
          </div>
        )}
      </div>

      {technologies.length > 0 && (
        <TechLogoRow
          technologies={technologies.slice(0, 10)}
          isActive
          size="lg"
          className="mt-8"
        />
      )}
    </header>
  );
}
