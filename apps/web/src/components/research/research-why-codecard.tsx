'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/landing/scroll-reveal';
import { TYPE } from '@/lib/design/tokens';

const BLOCKS = [
  {
    title: 'The problem',
    body: 'Most profiles lead with schools and job titles. Your projects sit at the bottom. People skim for a few seconds. Your proof may never get seen.',
  },
  {
    title: 'What CodeCard is',
    body: 'One link to a profile that opens with what you built: projects, demos, and results. Your name, role, and background still matter. They just do not take the first look.',
  },
  {
    title: 'What is inside',
    body: 'Project cards with screenshots, video, and tech stack. Repo and live demo links. Share by URL, QR code, or NFC at events. Analytics on profile and project views. Private notes on people you meet.',
  },
  {
    title: 'Why it matters',
    body: 'Strong work does not help if nobody sees it. CodeCard puts your proof where people look first, so the conversation starts with what you built.',
  },
] as const;

export function ResearchWhyCodecard() {
  return (
    <section className="cc-container py-2 md:py-4" aria-labelledby="research-why-codecard-heading">
      <ScrollReveal>
        <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-reactor">Why CodeCard</p>
        <h2
          id="research-why-codecard-heading"
          className={`mt-5 max-w-[900px] text-balance ${TYPE.sectionHeading} text-vellum`}
        >
          Show your work first. Share one link.
        </h2>
        <p className="mt-6 max-w-[760px] text-[19px] font-medium leading-[1.5] text-lichen md:text-[21px]">
          CodeCard is a work-first profile for builders. Put your best projects up front, keep your
          credentials still matter, and share one link everywhere you show up.
        </p>

        <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-x-16 md:gap-y-14 lg:max-w-[1120px]">
          {BLOCKS.map((block) => (
            <div key={block.title}>
              <h3 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.3px] text-vellum md:text-[32px]">
                {block.title}
              </h3>
              <p className="mt-4 text-[18px] font-medium leading-[1.55] text-lichen md:text-[20px] md:leading-[1.5]">
                {block.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link
            href="/profiles"
            className="text-[17px] font-semibold text-reactor transition-colors hover:text-vellum"
          >
            See live demo →
          </Link>
          <Link
            href="/sign-up"
            className="text-[17px] font-semibold text-ash transition-colors hover:text-vellum"
          >
            Start free →
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}
