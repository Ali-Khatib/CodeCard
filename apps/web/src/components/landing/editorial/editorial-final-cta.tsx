import Link from 'next/link';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';

export function EditorialFinalCta() {
  return (
    <section
      id="build-yours"
      className="cc-ed__section cc-ed-finale"
      data-chapter-section="finale"
      data-testid="editorial-finale"
      aria-labelledby="editorial-finale-heading"
    >
      <div className="cc-ed-finale__inner">
        <p className="cc-ed__eyebrow">Start</p>
        <h2
          id="editorial-finale-heading"
          className="cc-ed__display cc-ed__display--xl mt-3"
        >
          <span className="cc-ed__lead">YOUR WORK. YOUR IDENTITY.</span>
          <span className="cc-ed__sub">YOUR CONNECTIONS.</span>
        </h2>
        <p className="cc-ed__lede mt-3">
          Keep your work, identity, and valuable connections with you.
        </p>
        <div className="cc-ed__actions mt-6">
          <Link
            href="/sign-up"
            className="cc-ed__btn-primary cc-instant-press"
            data-testid="finale-primary-cta"
          >
            Create Your CodeCard
          </Link>
          <LiveDemoLink className="cc-ed__btn-ghost cc-instant-press">
            Open Live Demo
          </LiveDemoLink>
        </div>
      </div>
    </section>
  );
}
