import Link from 'next/link';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { ShaderHeroBackdrop } from '@/components/ui/shader-hero';
import { EditorialHeroAnimatedHeadline } from './editorial-hero-animated-headline';

/**
 * Inset shader hero: oversized type + CTAs over the orange/black field.
 * Frame expand + statement reveal are owned by EditorialHeroScene.
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
      <div className="cc-ed-hero__media" data-hero-shader aria-hidden>
        <ShaderHeroBackdrop />
        <div className="cc-ed-hero__veil" />
      </div>

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
          <p className="cc-ed__lede mt-6">
            Projects, Research, and Connections, presented through one living
            technical profile.
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
    </section>
  );
}
