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
      <div className="grid w-full min-w-0 gap-4 md:grid-cols-[96px_1fr] md:items-center">
        <div className="flex justify-center">
          <div className="relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-full border border-[var(--app-border)] bg-[var(--app-bone)]">
            {creator.avatarUrl ? (
              <Image src={creator.avatarUrl} alt="" fill className="object-cover" sizes="82px" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-medium">
                {creator.displayName?.[0] ?? '?'}
              </span>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-center sm:text-left">
            <h2 className="text-[24px] font-medium tracking-[-0.03em] text-[var(--app-ink)]">
              {creator.displayName}
            </h2>
            {roleLine && <p className="mt-1 text-[15px] text-[var(--app-smoke)]">{roleLine}</p>}
            {creator.location && <p className="mt-1 text-[14px] text-[var(--app-smoke)]">{creator.location}</p>}
          </div>

          <div className="min-w-0 shrink-0">
            {creator.links.length > 0 && (
              <div className="flex w-full min-w-0 flex-wrap justify-center gap-2 sm:justify-start">
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
                      title={label}
                      className="cc-app-btn cc-app-btn--ghost !h-9 !w-9 !px-0"
                    >
                      <Icon className="text-sm" aria-hidden />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {!embedded && (
            <div className="flex min-w-0 flex-wrap justify-center gap-2 sm:basis-full sm:justify-start">
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
          )}
        </div>
      </div>
    </article>
  );
}
