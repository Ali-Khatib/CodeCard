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
      <div className="cc-app-card p-10 text-center md:p-14">
        <p className="cc-app-mono">Projects</p>
        <h2 className="cc-app-title mt-3 !text-[clamp(28px,4vw,40px)]">
          {EMPTY_STATE_COPY.projects.title}
        </h2>
        <p className="cc-app-subtitle mx-auto mt-3">
          {EMPTY_STATE_COPY.projects.description}
        </p>
        <Link href="/dashboard/projects/new" className="cc-app-btn cc-app-btn--primary mt-8 inline-flex">
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
