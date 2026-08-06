import Image from 'next/image';
import Link from 'next/link';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';

/** Warm full-bleed editorial photo — Parloa-scale first impression. */
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2400&q=80';

/**
 * Full-bleed photo hero: big picture first, then oversized type + CTAs.
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
      <div className="cc-ed-hero__media" aria-hidden>
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="cc-ed-hero__img"
        />
        <div className="cc-ed-hero__veil" />
        <div className="cc-ed-hero__flare" />
      </div>

      <div className="cc-ed-hero__content" data-testid="hero-section">
        <p className="cc-ed__eyebrow">CodeCard</p>
        <h1
          id="editorial-hero-heading"
          className="cc-ed__display cc-ed__display--xl mt-4"
          data-hero-statement
        >
          <span className="cc-ed__lead">YOUR WORK.</span>
          <span className="cc-ed__sub">ONE IDENTITY.</span>
        </h1>
        <p className="cc-ed__lede mt-6">
          Projects, research, Circle, and connections, presented through one
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
