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
          YOUR BEST WORK
          <br />
          SHOULDN’T LIVE
          <br />
          IN FIVE DIFFERENT PLACES.
        </h2>
        <p className="cc-ed__lede">
          CodeCard brings your projects, research, Circle, and connections into
          one shareable identity.
        </p>
      </div>
    </section>
  );
}
