'use client';

const AUDIENCE = [
  {
    eyebrow: 'Builders',
    title: 'Lead with proof.',
    body: 'Repos, demos, and case studies first—not buried under schools and titles.',
  },
  {
    eyebrow: 'Recruiters',
    title: 'Decide faster.',
    body: 'Identity, role, and demonstrated work in one glance. Skip the PDF chase.',
  },
  {
    eyebrow: 'Events',
    title: 'Show it live.',
    body: 'QR or your screen at a meetup—they scan and scroll your work while you talk.',
  },
  {
    eyebrow: 'Students',
    title: 'Stand out early.',
    body: 'Ship projects before the degree line. Show skill, not just school.',
  },
  {
    eyebrow: 'Freelancers',
    title: 'Win the brief.',
    body: 'One link that shows how you think, build, and deliver for clients.',
  },
] as const;

/**
 * Who it’s for — horizontal drifting audience cards (marquee).
 */
export function EditorialAudience() {
  const loop = [...AUDIENCE, ...AUDIENCE];

  return (
    <section
      id="audience"
      className="cc-ed__section cc-ed-audience"
      data-chapter-section="audience"
      data-testid="editorial-audience"
      aria-labelledby="editorial-audience-heading"
    >
      <div className="cc-ed-audience__intro">
        <p className="cc-ed__eyebrow">Who it’s for</p>
        <h2 id="editorial-audience-heading" className="cc-ed__display mt-3">
          <span className="cc-ed__lead">FIVE WAYS TO USE IT.</span>
          <span className="cc-ed__sub">
            Builders, recruiters, events, students, freelancers.
          </span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-4">
          Same living profile—whether you’re pitching, recruiting, networking,
          learning, or freelancing.
        </p>
      </div>

      <div className="cc-ed-audience__viewport">
        <div
          className="cc-ed-audience__track"
          data-testid="editorial-audience-track"
        >
          {loop.map((card, index) => (
            <article
              key={`${card.eyebrow}-${index}`}
              className="cc-ed-audience__card"
            >
              <p className="cc-ed-audience__eyebrow">{card.eyebrow}</p>
              <h3 className="cc-ed-audience__title">{card.title}</h3>
              <p className="cc-ed-audience__body">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
