import Image from 'next/image';
import Link from 'next/link';

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
          <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-graphite">Projects</p>
          <h1 className="mt-2 font-display text-[28px] font-medium text-phosphor">Featured work</h1>
          <p className="mt-2 max-w-lg text-[15px] text-lichen">
            Your public profile leads with projects. Add your first one to go live.
          </p>
        </div>

        <div className="cc-workspace-tile rounded-[14px] border border-border/40 p-8 text-center md:p-12">
          <p className="font-display text-[22px] text-phosphor">No projects yet</p>
          <p className="mx-auto mt-2 max-w-sm text-[15px] text-lichen">
            Create a project card with a title, tagline, hero image, and links — the same format visitors
            see on your CodeCard.
          </p>
          <Link
            href="/dashboard/projects/new"
            className="cc-btn-pill-primary mt-8 inline-flex h-11 items-center px-6 text-[15px]"
          >
            Create your first project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-graphite">Projects</p>
          {!hasProjects && (
            <>
              <h1 className="mt-2 font-display text-[28px] font-medium text-phosphor">Featured work</h1>
              <p className="mt-2 max-w-lg text-[15px] text-lichen">
                Example projects — sign up to publish your own work.
              </p>
            </>
          )}
          {hasProjects && (
            <>
              <h1 className="mt-2 font-display text-[28px] font-medium text-phosphor">Featured work</h1>
              <p className="mt-2 max-w-lg text-[15px] text-lichen">
                Reorder and publish the projects visitors see first.
              </p>
            </>
          )}
        </div>
        {showNewButton && hasProjects && (
          <Link
            href="/dashboard/projects/new"
            className="cc-btn-pill-primary inline-flex h-10 items-center px-5 text-[14px]"
          >
            New project
          </Link>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card, i) => (
          <Link
            key={card.key}
            href={card.href}
            className="cc-workspace-tile group overflow-hidden rounded-[10px] border border-border/40 transition-colors hover:border-reactor/30"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="p-4">
              <p className="font-display text-[18px] text-phosphor group-hover:text-vellum">{card.title}</p>
              <p className="mt-1 text-[13px] text-lichen">{card.subtitle}</p>
            </div>
            <div className="relative mx-4 mb-4 h-28 overflow-hidden rounded-[8px] bg-gradient-to-br from-reactor/25 via-midnight to-void-canvas">
              {card.posterUrl ? (
                <Image
                  src={card.posterUrl}
                  alt=""
                  fill
                  className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
                  sizes="(max-width: 640px) 100vw, 320px"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-reactor/20 to-transparent" />
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
