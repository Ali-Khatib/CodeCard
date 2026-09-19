'use client';

import Link from 'next/link';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { CODECARD_INTRO_HOOK, CODECARD_INTRO_USE_CASES } from '@/lib/marketing/positioning';
import { ScrollReveal } from '@/components/landing/scroll-reveal';
import { TYPE } from '@/lib/design/tokens';

const BLOCKS = [
  {
    title: 'Show the work itself',
    body: 'Projects with images, stack, demos, and outcomes. Research presented so someone can actually understand it. One of the quickest ways to put your actual work in front of someone.',
  },
  {
    title: 'Connect for real',
    body: 'Connections start with a face to face meeting, not a search or a cold invite. Then you keep when, where, what you talked about, and the next step.',
  },
  {
    title: 'A different purpose',
    body: 'GitHub is excellent for hosting and collaborating on code. LinkedIn serves as a professional networking platform. CodeCard is the layer between your identity, your work, and the people you meet in the real world. It can sit next to the tools you already use.',
  },
  {
    title: 'The rest of the system',
    body: 'Events you plan to attend. Circle for the people you chose. Analytics for how your identity and work are being seen. Follow through so a strong meeting can become collaboration.',
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
