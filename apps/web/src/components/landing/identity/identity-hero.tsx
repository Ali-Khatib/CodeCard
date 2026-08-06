import dynamic from 'next/dynamic';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { MagneticCta } from '@/components/interactions/magnetic-cta';
import { CtaArrow } from '@/components/interactions/glow-press';
import { IdentityProductCard } from './identity-product-card';

const IdentityHeroClient = dynamic(
  () => import('./identity-hero-client').then((m) => m.IdentityHeroClient),
  { ssr: true, loading: () => null },
);

/**
 * Identity hero — Server Component so the LCP headline ships in initial HTML.
 * Headline stays visible in the first paint (never hidden before motion).
 */
export function IdentityHero() {
  return (
    <section
      className="cc-id-hero scroll-mt-28"
      data-testid="identity-hero"
      aria-labelledby="identity-hero-heading"
    >
      <IdentityHeroClient />

      <div className="cc-container">
        <div className="cc-id-hero__stage" data-testid="hero-section">
          <div>
            <h1
              id="identity-hero-heading"
              data-hero-statement
              className="cc-id-hero__headline"
            >
              <span className="cc-id-hero__headline-line">Your best work.</span>
              <span className="cc-id-hero__headline-line cc-hume-gradient-text">
                Ready to share in seconds.
              </span>
            </h1>

            <p className="cc-id-hero__support">
              Import your best projects, publish one page, and share it by link, QR, or straight from
              your screen.
            </p>

            <div className="cc-id-hero__ctas" data-hero-cta>
              <MagneticCta
                href="/sign-up"
                className="cc-btn-pill-primary h-11 px-8 text-[15px]"
                data-testid="hero-primary-cta"
              >
                Create Your CodeCard <CtaArrow />
              </MagneticCta>
              <LiveDemoLink className="cc-btn-pill-ghost cc-btn-glow cc-instant-press h-11 px-8 text-[15px]">
                Open Live Demo
              </LiveDemoLink>
            </div>
          </div>

          <div className="cc-id-hero__card-wrap">
            <IdentityProductCard state="profile" />
          </div>
        </div>
      </div>
    </section>
  );
}
