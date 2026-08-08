/**
 * Section 2 — quiet declarative beats on warm editorial canvas.
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
      <div className="cc-ed-statement__inner">
        <p className="cc-ed__eyebrow">The problem</p>
        <h2
          id="editorial-statement-heading"
          className="cc-ed__display cc-ed__display--xl mt-5"
        >
          <span className="cc-ed__lead">YOUR BEST WORK SHOULDN’T</span>
          <span className="cc-ed__sub">LIVE IN FIVE PLACES.</span>
        </h2>
        <p className="cc-ed__lede">
          CodeCard brings projects, research, Circle, and connections into one
          shareable identity.
        </p>
      </div>

      <div
        className="cc-ed-statement__inner cc-ed-statement__beat"
        data-testid="editorial-statement-showcase"
      >
        <p className="cc-ed__eyebrow">The shift</p>
        <h2 className="cc-ed__display cc-ed__display--xl mt-5">
          <span className="cc-ed__lead">DON’T SEND A LINK AND HOPE.</span>
          <span className="cc-ed__sub">SHOW THE WORK ON THE SPOT.</span>
        </h2>
        <p className="cc-ed__lede">
          The quickest, most impressive way to showcase exactly what you do, so
          people see it clearly right away, not after they guess what a link
          means.
        </p>
      </div>
    </section>
  );
}
