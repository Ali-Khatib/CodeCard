import Link from 'next/link';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';

/**
 * Dark editorial hero — copy-led, no right-side product mock.
 */
export function EditorialHero() {
  return (
    <section
      id="hero"
      className="cc-ed__section cc-ed-hero"
      data-chapter-section="hero"
      data-testid="editorial-hero"
      aria-labelledby="editorial-hero-heading"
    >
      <div className="cc-ed-hero__solo" data-testid="hero-section">
        <div className="cc-ed-hero__mark" aria-hidden />
        <p className="cc-ed__eyebrow">CodeCard</p>
        <h1
          id="editorial-hero-heading"
          className="cc-ed__display cc-ed__display--xl mt-4"
          data-hero-statement
        >
          YOUR WORK.
          <br />
          <span className="cc-ed__accent">ONE IDENTITY.</span>
        </h1>
        <p className="cc-ed__lede mt-6">
          Projects, research, Circle, and connections—presented through one
          living technical profile.
        </p>
        <div className="cc-ed__actions mt-8">
          <Link
            href="/sign-up"
            className="cc-ed__btn-primary cc-instant-press"
            data-testid="hero-primary-cta"
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
