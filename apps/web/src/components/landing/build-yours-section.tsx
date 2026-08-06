'use client';

import Link from 'next/link';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import {
  CODECARD_HEADLINE,
  CODECARD_SUMMARY,
  CODECARD_INTRO_PITCH,
  CODECARD_TAGLINE,
} from '@/lib/marketing/positioning';
import { LIVE_DEMO_HREF } from '@/lib/marketing/demo-url';
import { ScrollReveal } from './scroll-reveal';
import { MorphSignupCta } from './morph-signup-cta';
import { TYPE } from '@/lib/design/tokens';
import { CtaArrow } from '@/components/interactions/glow-press';
import { IdentityProductCard } from './identity/identity-product-card';

export function BuildYoursSection() {
  return (
    <section id="build-yours" className="scroll-mt-28 py-20 md:py-[100px]">
      <div className="cc-container">
        <ScrollReveal>
          <div className="cc-landing-closing cc-landing-closing--ambient mx-auto max-w-[820px] text-center">
            <div className="cc-landing-closing__echo mx-auto mb-8 max-w-[380px]" aria-hidden>
              <IdentityProductCard state="profile" />
            </div>

            <h2 className={`${TYPE.sectionHeading} text-ink`}>{CODECARD_INTRO_PITCH}</h2>

            <p className="cc-landing-closing__tagline mx-auto mt-5 max-w-[640px] text-[17px] leading-[1.55] text-smoke md:text-[18px]">
              {CODECARD_TAGLINE}
            </p>

            <h3 className={`mt-8 font-display text-[22px] leading-snug text-ink md:text-[26px]`}>
              {CODECARD_HEADLINE}
            </h3>

            <p className="mx-auto mt-6 max-w-[640px] text-[17px] leading-[1.55] text-ash md:text-[18px]">
              {CODECARD_SUMMARY}
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <MorphSignupCta layoutId="landing-closing-cta" />
              <LiveDemoLink className="cc-btn-pill-demo cc-btn-glow cc-instant-press inline-flex h-11 items-center px-8 text-[15px]">
                Live demo workspace <CtaArrow />
              </LiveDemoLink>
            </div>

            <Link
              href={LIVE_DEMO_HREF}
              className="cc-landing-closing__profile-link"
              data-testid="closing-profile-preview-link"
            >
              Open the live workspace
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
