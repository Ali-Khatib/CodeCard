import { LANDING_FAQ_ITEMS } from '@/lib/marketing/landing-faq';

export function EditorialFaq() {
  return (
    <section
      id="faq"
      className="cc-ed__section cc-ed-faq"
      data-chapter-section="faq"
      data-testid="editorial-faq"
      aria-labelledby="editorial-faq-heading"
    >
      <div className="cc-ed-faq__intro">
        <p className="cc-ed__eyebrow">Common questions</p>
        <h2 id="editorial-faq-heading" className="cc-ed__display mt-3">
          <span className="cc-ed__lead">WHAT CODECARD</span>
          <span className="cc-ed__sub">IS, AND ISN&apos;T.</span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-4">
          CodeCard is for real world introductions. Show your work, connect with
          the person in front of you, and follow up after.
        </p>
      </div>

      <div className="cc-ed-faq__list">
        {LANDING_FAQ_ITEMS.map((item) => (
          <details key={item.question} className="cc-ed-faq__item">
            <summary className="cc-ed-faq__question">{item.question}</summary>
            <p className="cc-ed-faq__answer">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
