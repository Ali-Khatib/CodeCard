'use client';

import Link from 'next/link';
import { EMPTY_STATE_COPY } from '@/lib/dashboard/empty-state-copy';
import { ProjectCardRich, type RichProjectCard } from './project-card-rich';

export function DashboardProjectsMasonry({
  cards,
  emptyState = false,
}: {
  cards: RichProjectCard[];
  emptyState?: boolean;
}) {
  if (emptyState) {
    return (
      <div className="cc-dash-glass cc-dash-empty-hero rounded-[16px] p-10 text-center md:p-14">
        <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-reactor">Projects</p>
        <h2 className="mt-3 font-display text-[32px] text-vellum md:text-[40px]">
          {EMPTY_STATE_COPY.projects.title}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-lichen">
          {EMPTY_STATE_COPY.projects.description}
        </p>
        <Link href="/dashboard/projects/new" className="cc-btn-pill-primary mt-8 inline-flex h-11 items-center px-7">
          {EMPTY_STATE_COPY.projects.cta}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      {cards.map((card, i) => (
        <ProjectCardRich key={card.key} card={card} index={i} />
      ))}
    </div>
  );
}
