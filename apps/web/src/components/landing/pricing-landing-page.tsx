'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PLANS } from '@codecard/config';
import { TYPE } from '@/lib/design/tokens';
import { SectionCounter } from './section-counter';
import { MorphSignupCta } from './morph-signup-cta';
import { ScrollReveal } from './scroll-reveal';
import { AuroraDivider } from './aurora-divider';

const FAQ = [
  {
    q: 'Can I start for free?',
    a: 'Yes. The Free plan includes a public profile, up to five projects, analytics, and link sharing.',
  },
  {
    q: 'How does billing work?',
    a: 'Pro is billed monthly or yearly on the web. Manage your subscription anytime from the dashboard.',
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
          <h1 className={`mt-6 ${TYPE.sectionHeading} mx-auto max-w-[16ch] text-balance text-phosphor`}>
            Start free. <span className="cc-text-reactor">Grow</span> when you need more.
          </h1>
          <p className="mx-auto mt-8 max-w-[580px] text-[18px] leading-[1.56] text-lichen">
            Publish your CodeCard, share projects, and upgrade for analytics and custom domains.
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
              <span className="ml-1.5 text-[12px] opacity-80">−20%</span>
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
              const price =
                plan.id === 'free'
                  ? 0
                  : yearly && plan.id === 'pro'
                    ? PLANS.pro.priceYearly
                    : monthly;
              const suffix = plan.id === 'free' ? '' : yearly ? '/yr' : '/mo';
              const isPro = plan.id === 'pro';

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
                    <p className="mt-6 font-display text-[48px] font-medium leading-none tracking-[-0.3px] text-phosphor md:text-[56px]">
                      ${price}
                      {suffix && <span className="text-[16px] font-normal text-graphite">{suffix}</span>}
                    </p>
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
            <p className="mt-6 text-[18px] text-lichen">Free to start. Upgrade only when you need Pro.</p>
            <div className="mt-10 flex justify-center">
              <MorphSignupCta layoutId="pricing-final-cta" />
            </div>
            <Link href="/profiles" className="mt-6 inline-block text-[15px] text-graphite transition-colors hover:text-reactor">
              Explore live demo →
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
