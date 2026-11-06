'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PLANS } from '@codecard/config';
import { Cc2PageHead } from './page-head';
import { useInViewOnce } from './hooks';
import '@/styles/cc2-pages.css';

const YEARLY = PLANS.pro.priceYearly;
const MONTHLY = PLANS.pro.priceMonthly;
const SAVE = Math.round((1 - YEARLY / (MONTHLY * 12)) * 100);

const QA = [
  ['Can I start for free?', 'Yes. Free is built to help you create and share a CodeCard fast: up to five projects, basic media, QR and link sharing, and basic analytics.'],
  ['How does billing work?', `Pro is $${MONTHLY}/month or $${YEARLY}/year. Pay with Stripe and manage your subscription any time from the dashboard.`],
  ['Do visitors need an account?', 'No. Profiles and projects are public. Connections require a visitor account and a physical CodeCard QR scan.'],
  ['Can I use a custom domain?', 'Yes. Custom domains are included with Pro. Set one up from Settings once you upgrade.'],
] as const;

export function Cc2Pricing() {
  const [yearly, setYearly] = useState(false);
  const [ref, seen] = useInViewOnce<HTMLDivElement>(0.15);

  return (
    <div className="cc2-tone cc2-tone--paper cc2-pagebody">
      <Cc2PageHead
        title="Pricing"
        lede="Free covers creating and sharing a CodeCard. Pro adds room, control and insight."
      >
        <div className="cc2-seg" role="group" aria-label="Billing period">
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>
            Monthly
          </button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>
            Yearly <span>save {SAVE}%</span>
          </button>
        </div>
      </Cc2PageHead>

      <div ref={ref} className="cc2-wrap cc2-plans" data-in={seen ? 'true' : 'false'}>
        {Object.values(PLANS).map((plan, i) => {
          const pro = plan.id === 'pro';
          const price = !pro ? 0 : yearly ? YEARLY : MONTHLY;
          return (
            <article key={plan.id} className="cc2-plan" data-pro={pro} style={{ ['--i' as string]: i }}>
              <h2 className="cc2-plan__name">{plan.name}</h2>
              <p className="cc2-plan__for">
                {pro ? 'More capacity, customization and analytics.' : 'Everything you need to create and share a CodeCard.'}
              </p>
              <p className="cc2-plan__price">
                <span aria-live="polite">${price}</span>
                {pro ? <small>{yearly ? '/year' : '/month'}</small> : null}
              </p>
              <ul>
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link
                href={pro ? '/dashboard/billing' : '/sign-up'}
                className={`cc2-btn ${pro ? 'cc2-btn--signal' : 'cc2-btn--line'}`}
              >
                {pro ? 'Upgrade to Pro' : 'Get started'}
              </Link>
            </article>
          );
        })}
      </div>

      <section className="cc2-wrap cc2-qa" aria-labelledby="cc2-pricing-qa">
        <h2 id="cc2-pricing-qa" className="cc2-h2">
          Common questions
        </h2>
        <dl>
          {QA.map(([q, a]) => (
            <div key={q}>
              <dt>{q}</dt>
              <dd>{a}</dd>
            </div>
          ))}
        </dl>
        <p className="cc2-meta">Subscriptions are purchased on the web. The mobile app is consumption-only in v1.</p>
      </section>
    </div>
  );
}
