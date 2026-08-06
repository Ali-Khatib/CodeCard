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
          className="cc-ed__display cc-ed__display--xl mt-4"
        >
          BUILD THE PROFILE
          <br />
          YOUR WORK DESERVES.
        </h2>
        <p className="cc-ed__lede mt-5">
          Put projects, research, Circle, connections, and analysis in one
          living identity.
        </p>
        <div className="cc-ed__actions mt-8">
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
