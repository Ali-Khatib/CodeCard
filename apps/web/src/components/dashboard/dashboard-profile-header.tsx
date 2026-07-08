'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getProfileLinkAria, resolveProfileLinkIcon } from '@/lib/icons/profile-links';
import type { PortfolioCreator } from '@/lib/dashboard/portfolio';
import { AsyncActionButton } from '@/components/ui/async-action-button';
import { AppButton } from './ui/dashboard-ui';

const SOCIAL_LABELS: Record<string, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  website: 'Website',
  twitter: 'X',
  x: 'X',
  resume: 'Resume',
  email: 'Email',
};

type DashboardProfileHeaderProps = {
  creator: PortfolioCreator;
  previewHref?: string | null;
  profileSlug?: string | null;
  embedded?: boolean;
};

export function DashboardProfileHeader({
  creator,
  previewHref,
  profileSlug,
  embedded = false,
}: DashboardProfileHeaderProps) {
  const slug = profileSlug ?? creator.profileSlug;

  const roleLine = [creator.role, creator.company].filter(Boolean).join(' · ');

  return (
    <article
      className={`cc-app-profile-preview w-full min-w-0${embedded ? ' cc-app-profile-preview--embedded' : ''}`}
    >
      <div className="flex w-full min-w-0 flex-col gap-5">
        <div className="flex w-full min-w-0 items-start gap-4">
          <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border border-[var(--app-border)] bg-[var(--app-bone)]">
            {creator.avatarUrl ? (
              <Image src={creator.avatarUrl} alt="" fill className="object-cover" sizes="72px" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-medium">
                {creator.displayName?.[0] ?? '?'}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-[22px] font-medium tracking-[-0.025em] text-[var(--app-ink)]">
              {creator.displayName}
            </h2>
            {roleLine && <p className="mt-1 text-[15px] text-[var(--app-smoke)]">{roleLine}</p>}
            {creator.location && (
              <p className="mt-1 text-[14px] text-[var(--app-smoke)]">{creator.location}</p>
            )}
            {creator.availability && (
              <span className="cc-app-badge cc-app-badge--mint mt-3 inline-flex">
                {creator.availability}
              </span>
            )}
          </div>
        </div>

        {creator.links.length > 0 && (
          <div className="flex w-full min-w-0 flex-wrap gap-2">
            {creator.links.map((link) => {
              const Icon = resolveProfileLinkIcon(link.type);
              const label = link.label ?? SOCIAL_LABELS[link.type.toLowerCase()] ?? 'Link';
              return (
                <Link
                  key={link.url + link.type}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={getProfileLinkAria(link.type, link.label)}
                  className="cc-app-btn cc-app-btn--ghost !h-9 !px-3 !text-[13px]"
                >
                  <Icon className="text-sm" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex w-full min-w-0 flex-wrap gap-2">
          {slug && (
            <AsyncActionButton
              variant="ghost"
              ariaLabel="Copy public link"
              successLabel="Copied"
              onAction={async () => {
                await navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
              }}
            >
              Copy public link
            </AsyncActionButton>
          )}
          {(previewHref || slug) && (
            <AppButton variant="primary" href={previewHref ?? `/${slug}`}>
              View public card
            </AppButton>
          )}
        </div>
      </div>
    </article>
  );
}
