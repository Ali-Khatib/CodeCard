/**
 * Section 2 — quiet declarative statement on warm editorial canvas.
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
          <span className="cc-ed__lead">YOUR BEST WORK</span>
          <span className="cc-ed__sub">SHOULDN’T LIVE IN FIVE PLACES.</span>
        </h2>
        <p className="cc-ed__lede">
          CodeCard brings your projects, research, Circle, and connections into
          one shareable identity.
        </p>
      </div>
    </section>
  );
}
