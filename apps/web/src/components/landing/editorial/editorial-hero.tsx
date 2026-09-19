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
            <span className="cc-ed__lead">YOUR WORK.</span>
            <span className="sr-only">ONE IDENTITY.</span>
            <EditorialHeroAnimatedHeadline />
          </h1>
        </div>
        <div className="cc-ed-hero__baseline">
          <div className="cc-ed-hero__baseline-copy">
            <p className="cc-ed__lede">
              Your work, your research, and the people you actually meet, held
              as one living technical identity. Stay connected. Follow through.
            </p>
            <p className="cc-ed__connect-principle">
              <strong>Meet. Show. Understand. Connect. Follow up.</strong> They
              scan your QR. Your CodeCard opens in their browser. They get the
              work while you are still talking. They do not need the app just to
              look. If they skip the scan, they can see it on your screen.
            </p>
          </div>
          <div className="cc-ed__actions cc-ed-hero__actions-corner">
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
      </div>
    </section>
  );
}
