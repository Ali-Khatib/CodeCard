import Image from 'next/image';
import { DEMO_FEATURED_PROJECTS } from '@/lib/projects/demo-data';

const ROWS = [
  {
    kicker: '01 · Project',
    title: 'A build with outcomes first.',
    body: 'Hero media, stack, demos, and the story behind the ship — not a buried repo link.',
    image: DEMO_FEATURED_PROJECTS[0]?.posterUrl,
  },
  {
    kicker: '02 · Research',
    title: 'Papers beside the system.',
    body: 'Abstracts, PDFs, and citations live next to the product that proves the claim.',
    image: DEMO_FEATURED_PROJECTS[1]?.posterUrl,
  },
  {
    kicker: '03 · Signal',
    title: 'What people actually opened.',
    body: 'Views, saves, and engagement without a separate dashboard tour for visitors.',
    image: DEMO_FEATURED_PROJECTS[2]?.posterUrl,
  },
] as const;

export function ProofInPractice() {
  return (
    <section className="cc-proof-practice" id="practice" data-testid="proof-in-practice">
      <div className="cc-proof-practice__intro">
        <p className="cc-proof__mono" style={{ margin: 0, color: 'var(--proof-signal)' }}>
          Proof in practice
        </p>
        <h2 className="cc-proof__display">REAL SURFACE. REAL WORK.</h2>
      </div>

      <div className="cc-proof-practice__rows">
        {ROWS.map((row) => (
          <article key={row.kicker} className="cc-proof-practice__row">
            <div className="cc-proof-practice__copy">
              <p className="cc-proof__mono" style={{ margin: 0, color: 'var(--proof-signal)' }}>
                {row.kicker}
              </p>
              <h3 className="cc-proof__display">{row.title}</h3>
              <p className="cc-proof__sans">{row.body}</p>
            </div>
            <div className="cc-proof-practice__media">
              {row.image ? (
                <Image src={row.image} alt="" fill sizes="(max-width: 900px) 100vw, 55vw" />
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
