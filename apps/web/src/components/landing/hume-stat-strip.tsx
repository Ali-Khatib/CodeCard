const POINTS = [
  {
    headline: 'Live in minutes',
    detail: 'Add your projects, hit publish. No coding.',
  },
  {
    headline: 'One link',
    detail: 'Share by text, email, QR, or show your screen.',
  },
  {
    headline: 'Saved with context',
    detail: 'Every scan can become a connection with notes and follow-ups.',
  },
] as const;

export function HumeStatStrip() {
  return (
    <section className="cc-container py-10 md:py-12" aria-label="How CodeCard works in three steps">
      <div className="cc-hume-stat-card">
        <ul className="cc-hume-stat-card__grid">
          {POINTS.map((point, i) => (
            <li key={point.headline} className="cc-hume-stat-card__item">
              <span className="cc-hume-stat-card__num" aria-hidden>
                {i + 1}
              </span>
              <p className="cc-hume-stat-card__headline">{point.headline}</p>
              <p className="cc-hume-stat-card__detail">{point.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
