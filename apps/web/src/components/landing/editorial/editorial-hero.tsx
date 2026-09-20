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
          <p className="cc-ed__eyebrow">CodeCard</p>
          <h1
            id="editorial-hero-heading"
            className="cc-ed__display cc-ed__display--xl mt-4"
            data-hero-statement
          >
            <span className="cc-ed__lead">SHARE YOUR WORK.</span>
            <span className="sr-only">KEEP THE CONNECTION.</span>
            <EditorialHeroAnimatedHeadline />
          </h1>
        </div>
        <div className="cc-ed-hero__baseline">
          <div className="cc-ed-hero__baseline-copy">
            <p className="cc-ed__lede">
              A professional profile built for real-world introductions. Show
              projects and research from your phone, then keep the people you
              meet with the context to follow up.
            </p>
            <p className="cc-ed__connect-principle">
              <strong>Phone or QR, then a browser.</strong> Visitors do not
              need the app just to look.
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
