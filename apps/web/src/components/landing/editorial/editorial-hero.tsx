import Link from 'next/link';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { EditorialHeroAnimatedHeadline } from './editorial-hero-animated-headline';

/**
 * Inset shader hero: oversized type + CTAs over the orange/black field.
 * Frame expand + statement reveal are owned by EditorialHeroScene, which also
 * owns the shader field — one element shared with the statement, so the two
 * sections cannot seam against each other.
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
      <div className="cc-ed-hero__content" data-testid="hero-section">
        <div className="cc-ed-hero__copy">
          <p className="cc-ed-hero__brand">CodeCard</p>
          <h1
            id="editorial-hero-heading"
            className="cc-ed-hero__headline"
            data-hero-statement
          >
            <span className="cc-ed-hero__show">SHARE YOUR WORK.</span>
            <span className="sr-only">KEEP THE CONNECTION.</span>
            <EditorialHeroAnimatedHeadline />
          </h1>
          <p className="cc-ed__connect-principle cc-ed-hero__quote">
            Where your work meets your people, and introductions become
            lasting connections.
          </p>
        </div>
        <div className="cc-ed-hero__baseline">
          <div className="cc-ed-hero__baseline-copy">
            <p className="cc-ed__lede">
              A profile for real-world introductions.
            </p>
          </div>
          <div className="cc-ed__actions cc-ed-hero__actions-corner">
            <Link
              href="/sign-up"
              className="cc-ed__btn-primary cc-instant-press"
              data-testid="hero-primary-cta"
            >
              Create your CodeCard
            </Link>
            <LiveDemoLink className="cc-ed__btn-ghost cc-instant-press">
              View live demo
            </LiveDemoLink>
          </div>
        </div>
      </div>
    </section>
  );
}
