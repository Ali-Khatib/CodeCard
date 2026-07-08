'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PLANS } from '@codecard/config';
import { TYPE } from '@/lib/design/tokens';
import { SectionCounter } from './section-counter';
import { MorphSignupCta } from './morph-signup-cta';
import { ScrollReveal } from './scroll-reveal';
import { AuroraDivider } from './aurora-divider';

const PRO_MONTHLY = PLANS.pro.priceMonthly;
const PRO_YEARLY = PLANS.pro.priceYearly;
const YEARLY_SAVINGS_PCT = Math.round((1 - PRO_YEARLY / (PRO_MONTHLY * 12)) * 100);
const PRO_YEARLY_PER_MONTH = (PRO_YEARLY / 12).toFixed(2);

const FAQ = [
  {
    q: 'Can I start for free?',
    a: 'Yes. Free is built to help you create and share a CodeCard fast: up to five projects, basic media, GitHub import, QR and link sharing, and basic analytics.',
  },
  {
    q: 'What do I get with Pro?',
    a: 'Pro is for when you want to use CodeCard seriously: look more professional, track more deeply, and customize more. You get unlimited projects, no CodeCard branding, a custom domain, premium analytics, visitor insights, AI insights, AI project polishing, guided project creation, and early access to new features.',
  },
  {
    q: 'How does billing work?',
    a: `Pro is $${PRO_MONTHLY}/month or $${PRO_YEARLY}/year. Pay with Stripe where available, or Paddle in 190+ countries where Stripe is limited. Manage your subscription anytime from the dashboard.`,
  },
  {
    q: 'Do visitors need an account?',
    a: 'No. Profiles and projects are public. Saving connections requires a visitor account.',
  },
  {
    q: 'Can I use a custom domain?',
    a: 'Custom domains are included on Pro.',
  },
] as const;

export function PricingLandingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="pb-16">
      <section className="cc-container scroll-mt-28 pb-16 pt-[120px] text-center md:pt-[140px]">
        <ScrollReveal>
          <SectionCounter index="01" label="Pricing" />
          <h1 className={`mt-6 ${TYPE.sectionHeading} mx-auto max-w-[20ch] text-balance text-phosphor`}>
            Create fast. <span className="cc-text-reactor">Upgrade</span> when it matters.
          </h1>
          <p className="mx-auto mt-8 max-w-[600px] text-[18px] leading-[1.56] text-lichen">
            Free helps you launch and share a CodeCard in minutes. Pro helps you look more professional,
            track more deeply, and customize more.
          </p>

          <div className="mt-10 inline-flex rounded-full border border-border/50 bg-midnight p-1 shadow-rim">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`rounded-btn px-5 py-2 text-[14px] font-medium transition-colors ${
                !yearly ? 'bg-reactor text-pearl' : 'text-graphite hover:text-phosphor'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`rounded-btn px-5 py-2 text-[14px] font-medium transition-colors ${
                yearly ? 'bg-reactor text-pearl' : 'text-graphite hover:text-phosphor'
              }`}
            >
              Yearly
              <span className="ml-1.5 text-[12px] opacity-80">−{YEARLY_SAVINGS_PCT}%</span>
            </button>
          </div>
        </ScrollReveal>
      </section>

      <AuroraDivider className="cc-container" />

      <section className="py-[80px] md:py-[100px]">
        <div className="cc-container">
          <div className="grid gap-5 md:grid-cols-2 md:gap-6">
            {Object.values(PLANS).map((plan, i) => {
              const monthly = plan.priceMonthly;
              const isPro = plan.id === 'pro';
              const price =
                plan.id === 'free' ? 0 : yearly && isPro ? PRO_YEARLY : monthly;
              const suffix = plan.id === 'free' ? '' : yearly && isPro ? '/yr' : '/mo';

              return (
                <ScrollReveal key={plan.id} delay={i * 0.1}>
                  <article
                    className={`flex h-full flex-col p-8 md:p-10 ${
                      isPro ? 'cc-surface-elevated border-reactor/20' : 'cc-surface-card'
                    }`}
                  >
                    <p className="cc-tag-dot text-[12px] font-medium uppercase tracking-[0.1em] text-graphite">
                      {plan.name}
                    </p>
                    <p className="mt-3 text-[15px] leading-snug text-lichen">{plan.tagline}</p>
                    <p className="mt-6 font-display text-[48px] font-medium leading-none tracking-[-0.3px] text-phosphor md:text-[56px]">
                      ${price}
                      {suffix && <span className="text-[16px] font-normal text-graphite">{suffix}</span>}
                    </p>
                    {isPro && yearly && (
                      <p className="mt-2 text-[15px] text-graphite">
                        ≈ ${PRO_YEARLY_PER_MONTH}/mo billed annually
                      </p>
                    )}
                    <ul className="mt-8 flex-1 space-y-3 text-[16px] text-lichen">
                      {plan.features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <span className="text-reactor" aria-hidden>
                            ✓
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={plan.id === 'free' ? '/sign-up' : '/dashboard/billing'}
                      className={`mt-10 flex h-11 items-center justify-center rounded-btn text-[15px] font-medium ${
                        isPro ? 'cc-btn-primary' : 'cc-btn-ghost border border-border/50'
                      }`}
                    >
                      {plan.id === 'free' ? 'Get started' : 'Upgrade to Pro'}
                    </Link>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="cc-container py-[80px] md:py-[100px]">
        <ScrollReveal>
          <SectionCounter index="02" label="FAQ" />
          <h2 className="mt-6 font-display text-[42px] font-medium leading-[1.17] tracking-[-0.3px] text-phosphor md:text-[48px]">
            Common questions.
          </h2>
        </ScrollReveal>
        <dl className="mt-12 space-y-4">
          {FAQ.map((item, i) => (
            <ScrollReveal key={item.q} delay={i * 0.06}>
              <div className="cc-surface-card p-6 md:p-8">
                <dt className="font-display text-[22px] font-medium leading-snug text-phosphor md:text-[24px]">
                  {item.q}
                </dt>
                <dd className="mt-3 text-[16px] leading-relaxed text-lichen">{item.a}</dd>
              </div>
            </ScrollReveal>
          ))}
        </dl>
        <p className="mt-12 text-center text-[14px] text-graphite">
          Subscriptions are purchased on the web. Mobile app is consumption-only in v1.
        </p>
      </section>

      <section className="py-[80px] md:py-[100px]">
        <ScrollReveal>
          <div className="cc-container mx-auto max-w-xl text-center">
            <h2 className={`${TYPE.sectionHeading} text-phosphor`}>
              Ready when you <span className="cc-text-reactor">are.</span>
            </h2>
            <p className="mt-6 text-[18px] text-lichen">
              Free to launch. Pro when you want to take it seriously.
            </p>
            <div className="mt-10 flex justify-center">
              <MorphSignupCta layoutId="pricing-final-cta" />
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
