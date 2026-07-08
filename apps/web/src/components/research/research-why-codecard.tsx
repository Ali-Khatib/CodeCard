'use client';

import Link from 'next/link';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { CODECARD_INTRO_HOOK, CODECARD_INTRO_USE_CASES } from '@/lib/marketing/positioning';
import { ScrollReveal } from '@/components/landing/scroll-reveal';
import { TYPE } from '@/lib/design/tokens';

const BLOCKS = [
  {
    title: 'Hand off your work',
    body: 'The fastest way to show what you are capable of. Link, QR, or your screen in the room. Like a business card, but your projects and demos are right there.',
  },
  {
    title: 'Remember who you met',
    body: 'Private notes on connections, where you met, and what to follow up on. LinkedIn keeps your network. CodeCard keeps your context.',
  },
  {
    title: 'Great tools, wrong moment',
    body: 'LinkedIn is built for careers and timelines. GitHub is built for repositories. Neither is built for one scroll of your best work when someone is right in front of you.',
  },
  {
    title: 'The piece that was missing',
    body: 'Import from what you already have, publish one page, and turn repositories into stories people actually understand. Your profiles link out. Setup takes minutes.',
  },
] as const;

export function ResearchWhyCodecard() {
  return (
    <section className="cc-container py-2 md:py-4" aria-labelledby="research-why-codecard-heading">
      <ScrollReveal>
        <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-iris">Why CodeCard</p>
        <h2
          id="research-why-codecard-heading"
          className={`mt-5 max-w-[920px] text-balance ${TYPE.sectionHeading} text-ink`}
        >
          {CODECARD_INTRO_HOOK}
        </h2>
        <p className="mt-6 max-w-[720px] text-[19px] font-normal leading-[1.5] text-smoke md:text-[21px]">
          {CODECARD_INTRO_USE_CASES}
        </p>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-12 lg:max-w-[1120px]">
          {BLOCKS.map((block) => (
            <div key={block.title} className="cc-why-codecard-point">
              <h3 className="font-display text-[22px] font-normal leading-snug tracking-[-0.02em] text-ink md:text-[24px]">
                {block.title}
              </h3>
              <p className="mt-3 text-[17px] leading-[1.55] text-smoke md:text-[18px]">
                {block.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-4">
          <LiveDemoLink className="cc-btn-pill-demo cc-instant-press inline-flex h-11 px-7 text-[15px]">
            Open live demo workspace →
          </LiveDemoLink>
          <Link
            href="/sign-up"
            className="text-[17px] font-medium text-ink transition-opacity hover:opacity-70"
          >
            Start free →
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}
