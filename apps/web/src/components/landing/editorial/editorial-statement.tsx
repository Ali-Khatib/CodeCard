const BEATS = [
  {
    id: 'problem',
    lead: 'YOUR BEST WORK SHOULDN’T',
    sub: 'LIVE IN FIVE PLACES.',
    lede: (
      <>
        Projects, research, Circle, and connections belong in{' '}
        <em className="cc-ed-statement__hot">one shareable identity</em> — not
        five tabs someone never opens.
      </>
    ),
    headingId: 'editorial-statement-heading',
    testId: undefined as string | undefined,
  },
  {
    id: 'shift',
    lead: 'DON’T SEND A LINK AND HOPE.',
    sub: 'SHOW THE WORK ON THE SPOT.',
    lede: (
      <>
        The quickest way to showcase exactly what you do, so people see it{' '}
        <em className="cc-ed-statement__hot">clearly right away</em> — not after
        they guess what a link means.
      </>
    ),
    headingId: undefined,
    testId: 'editorial-statement-showcase',
  },
  {
    id: 'identity',
    lead: 'CARRY THE CARD.',
    sub: 'NOT FIVE TABS.',
    lede: (
      <>
        Hand someone your CodeCard. They see the work, the papers, and the
        people in <em className="cc-ed-statement__hot">one profile</em> — without
        hunting across tabs.
      </>
    ),
    headingId: undefined,
    testId: undefined,
  },
] as const;

/**
 * Three pinned beats over the hero photo — IntegratedBio "What we do" load.
 */
export function EditorialStatement() {
  return (
    <section
      id="statement"
      className="cc-ed__section cc-ed-statement"
      data-chapter-section="statement"
      data-testid="editorial-statement"
      aria-labelledby="editorial-statement-heading"
    >
      <div className="cc-ed-statement__chrome">
        <p className="cc-ed-statement__tag">
          <span className="cc-ed-statement__tag-mark" aria-hidden />
          What this is
        </p>
        <p className="cc-ed-statement__pager" aria-live="polite">
          <span data-statement-index>01</span>
          <span className="cc-ed-statement__pager-total"> / 03</span>
        </p>
      </div>

      <div className="cc-ed-statement__slides">
        {BEATS.map((beat) => (
          <article
            key={beat.id}
            className="cc-ed-statement__beat"
            data-statement-beat={beat.id}
            data-testid={beat.testId}
          >
            <h2
              id={beat.headingId}
              className="cc-ed__display cc-ed__display--xl mt-5"
            >
              <span className="cc-ed__lead">{beat.lead}</span>
              <span className="cc-ed__sub">{beat.sub}</span>
            </h2>
            <p className="cc-ed__lede">{beat.lede}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
