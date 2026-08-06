import Link from 'next/link';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { LIVE_DEMO_PROFILE_HREF } from '@/lib/marketing/demo-url';
import { MagneticCta } from '@/components/interactions/magnetic-cta';
import { CtaArrow } from '@/components/interactions/glow-press';
import { IdentityProductCard } from './identity-product-card';

export function IdentityFinale() {
  return (
    <section
      id="build-yours"
      className="cc-id-finale scroll-mt-28"
      data-testid="identity-finale"
      aria-labelledby="identity-finale-heading"
    >
      <div className="cc-container">
        <div className="cc-id-finale__inner">
          <div>
            <p className="cc-id__eyebrow">The finale</p>
            <h2 id="identity-finale-heading" className="cc-id-finale__heading">
              Your best work.
              <br />
              Ready to share in seconds.
            </h2>
            <p className="cc-id-finale__support">
              Publish one living profile — projects, research, and proof in a single link visitors
              can open anywhere.
            </p>

            <div className="cc-id-finale__ctas">
              <MagneticCta
                href="/sign-up"
                className="cc-btn-pill-primary h-11 px-8 text-[15px]"
              >
                Create Your CodeCard <CtaArrow />
              </MagneticCta>
              <LiveDemoLink className="cc-btn-pill-ghost cc-btn-glow cc-instant-press h-11 px-8 text-[15px]">
                Enter Live Workspace
              </LiveDemoLink>
            </div>

            <Link
              href={LIVE_DEMO_PROFILE_HREF}
              className="cc-id-finale__profile-link"
              data-testid="closing-profile-preview-link"
            >
              View Public Profile →
            </Link>
          </div>

          <div className="cc-id-finale__card-wrap">
            <IdentityProductCard state="profile" />
          </div>
        </div>
      </div>
    </section>
  );
}
