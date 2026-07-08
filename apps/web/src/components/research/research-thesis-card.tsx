'use client';

import { ScrollReveal } from '@/components/landing/scroll-reveal';

export function ResearchThesisCard() {
  return (
    <section className="cc-research-thesis-band relative py-12 md:py-16">
      <div className="cc-container relative">
        <ScrollReveal>
          <div className="cc-research-thesis-card relative overflow-hidden rounded-[16px] p-8 md:p-10 lg:p-12">
            <div className="relative z-[2] grid gap-8 md:grid-cols-2 md:gap-12">
              <div>
                <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-iris">
                  The research does not say
                </p>
                <p className="mt-4 font-display text-[22px] font-normal leading-snug tracking-[-0.02em] text-ink md:text-[26px]">
                  &ldquo;Any projects section automatically beats credentials.&rdquo;
                </p>
              </div>
              <div>
                <p className="cc-tag-dot font-eyebrow text-[12px] uppercase tracking-[0.08em] text-iris">
                  It does show
                </p>
                <p className="mt-4 font-display text-[22px] font-normal leading-snug tracking-[-0.02em] text-ink md:text-[28px]">
                  First-pass attention goes to schools, titles, and headers. Buried project proof may never get
                  read.
                </p>
              </div>
            </div>
            <p className="relative z-[2] mt-8 text-[15px] text-smoke md:text-[16px]">
              We cite sources clearly and note their limits on every reference.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
