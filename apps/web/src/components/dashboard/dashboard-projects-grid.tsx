import Image from 'next/image';
import Link from 'next/link';
import { EMPTY_STATE_COPY } from '@/lib/dashboard/empty-state-copy';

export type ProjectCard = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  posterUrl?: string;
};

export function DashboardProjectsGrid({
  cards,
  showNewButton = true,
  hasProjects = false,
  emptyState = false,
}: {
  cards: ProjectCard[];
  showNewButton?: boolean;
  hasProjects?: boolean;
  emptyState?: boolean;
}) {
  if (emptyState) {
    return (
      <div className="space-y-6">
        <div>
          <p className="cc-app-mono">Projects</p>
          <h1 className="cc-app-title mt-2 !text-[clamp(28px,4vw,36px)]">
            {EMPTY_STATE_COPY.projects.title}
          </h1>
          <p className="cc-app-subtitle mt-2">
            {EMPTY_STATE_COPY.projects.description}
          </p>
        </div>

        <div className="cc-app-card p-8 text-center md:p-12">
          <p className="font-display text-[clamp(20px,3vw,24px)] font-medium text-[var(--app-ink)]">
            Empty for now
          </p>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-[var(--app-muted)]">
            Create a project card with a title, tagline, hero image, and links. Same format visitors
            see on your CodeCard.
          </p>
          <Link
            href="/dashboard/projects/new"
            className="cc-app-btn cc-app-btn--primary mt-8 inline-flex"
          >
            {EMPTY_STATE_COPY.projects.cta}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="cc-app-mono">Projects</p>
          {!hasProjects && (
            <>
              <h1 className="cc-app-title mt-2 !text-[clamp(28px,4vw,36px)]">Featured work</h1>
              <p className="cc-app-subtitle mt-2">
                Example projects — sign up to publish your own work.
              </p>
            </>
          )}
          {hasProjects && (
            <>
              <h1 className="cc-app-title mt-2 !text-[clamp(28px,4vw,36px)]">Featured work</h1>
              <p className="cc-app-subtitle mt-2">
                Reorder and publish the projects visitors see first.
              </p>
            </>
          )}
        </div>
        {showNewButton && hasProjects && (
          <Link
            href="/dashboard/projects/new"
            className="cc-app-btn cc-app-btn--primary"
          >
            New project
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="cc-app-card group block overflow-hidden !p-0 transition-colors hover:border-[var(--app-border-strong)]"
          >
            <div className="p-5">
              <p className="font-display text-[clamp(17px,1.6vw,20px)] font-medium leading-tight tracking-[-0.03em] text-[var(--app-ink)]">
                {card.title}
              </p>
              <p className="mt-1.5 text-[14px] leading-snug text-[var(--app-muted)]">{card.subtitle}</p>
            </div>
            <div className="relative mx-5 mb-5 h-28 overflow-hidden rounded-[12px] bg-[var(--app-bone)]">
              {card.posterUrl ? (
                <Image
                  src={card.posterUrl}
                  alt=""
                  fill
                  className="object-cover opacity-95 transition-opacity group-hover:opacity-100"
                  sizes="(max-width: 640px) 100vw, 320px"
                />
              ) : (
                <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--app-iris)_12%,transparent)]" />
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
