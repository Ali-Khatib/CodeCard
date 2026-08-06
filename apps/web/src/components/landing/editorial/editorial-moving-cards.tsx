'use client';

import Image from 'next/image';
import { DEMO_FEATURED_PROJECTS } from '@/lib/projects/demo-data';
import { DEMO_RESEARCH_PAPERS } from '@/lib/research/demo-data';
import { DEMO_CONNECTIONS } from '@/lib/dashboard/workspace-demo';

const CARDS = [
  {
    kind: 'Project',
    title: DEMO_FEATURED_PROJECTS[0]!.title,
    meta: DEMO_FEATURED_PROJECTS[0]!.tagline,
    image: DEMO_FEATURED_PROJECTS[0]!.screenshots?.[0] ?? DEMO_FEATURED_PROJECTS[0]!.posterUrl,
  },
  {
    kind: 'Research',
    title: DEMO_RESEARCH_PAPERS[0]!.title,
    meta: `${DEMO_RESEARCH_PAPERS[0]!.venue} · ${DEMO_RESEARCH_PAPERS[0]!.year}`,
    image: DEMO_RESEARCH_PAPERS[0]!.coverImageUrl,
  },
  {
    kind: 'Connection',
    title: DEMO_CONNECTIONS[0]!.name,
    meta: `${DEMO_CONNECTIONS[0]!.role} · ${DEMO_CONNECTIONS[0]!.company}`,
    image: DEMO_CONNECTIONS[0]!.avatarUrl,
  },
  {
    kind: 'Connection',
    title: DEMO_CONNECTIONS[1]!.name,
    meta: `${DEMO_CONNECTIONS[1]!.role} · ${DEMO_CONNECTIONS[1]!.company}`,
    image: DEMO_CONNECTIONS[1]!.avatarUrl,
  },
  {
    kind: 'Circle',
    title: DEMO_CONNECTIONS[2]!.name,
    meta: 'Shared a project in Circle',
    image: DEMO_CONNECTIONS[2]!.avatarUrl,
  },
  {
    kind: 'Project',
    title: DEMO_FEATURED_PROJECTS[1]?.title ?? 'SchemaSync',
    meta: DEMO_FEATURED_PROJECTS[1]?.tagline ?? 'Migration clarity for teams',
    image: DEMO_FEATURED_PROJECTS[1]?.screenshots?.[0] ?? DEMO_FEATURED_PROJECTS[1]?.posterUrl,
  },
] as const;

/**
 * Smooth horizontal card drift before the footer — Scheduling-like calm motion.
 * Disabled under reduced motion (static row).
 */
export function EditorialMovingCards() {
  const loop = [...CARDS, ...CARDS];

  return (
    <section
      id="moments"
      className="cc-ed__section cc-ed-marquee"
      data-chapter-section="moments"
      data-testid="editorial-moving-cards"
      aria-label="CodeCard moments"
    >
      <div className="cc-ed-marquee__intro">
        <p className="cc-ed__eyebrow">In the workspace</p>
        <h2 className="cc-ed__display mt-3">ONE PLACE. MANY SIGNALS.</h2>
      </div>

      <div className="cc-ed-marquee__viewport">
        <div className="cc-ed-marquee__track" data-testid="editorial-marquee-track">
          {loop.map((card, index) => (
            <article key={`${card.kind}-${index}`} className="cc-ed-marquee__card">
              <p className="cc-ed-marquee__kind">{card.kind}</p>
              {card.image ? (
                <div className="cc-ed-marquee__media">
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    sizes="280px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="cc-ed-marquee__media cc-ed-marquee__media--empty" />
              )}
              <p className="cc-ed-marquee__title">{card.title}</p>
              <p className="cc-ed-marquee__meta">{card.meta}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
