'use client';

import Link from 'next/link';
import { ScrollReveal } from './scroll-reveal';
import { SectionCounter } from './section-counter';
import { MorphSignupCta } from './morph-signup-cta';
import { TYPE } from '@/lib/design/tokens';

const SOURCES = ['GitHub', 'LinkedIn', 'Resume'] as const;

const STEPS = [
  {
    title: 'Connect your sources',
    detail: 'Pull repos, role, and resume context in one pass.',
  },
  {
    title: 'Auto-import projects',
    detail: 'CodeCard drafts featured work from what you already shipped.',
  },
  {
    title: 'Arrange featured work',
    detail: 'Drag projects into the order you want recruiters to see first.',
  },
  {
    title: 'Publish your profile',
    detail: 'Go live on a custom link with projects up front.',
  },
  {
    title: 'Share with QR',
    detail: 'Print or show a code at events. They scroll your work on mobile.',
  },
] as const;

export function BuildYoursSection() {
  return (
    <section id="build-yours" className="scroll-mt-28 py-20 md:py-[100px]">
      <div className="cc-container">
        <ScrollReveal>
          <SectionCounter label="Build yours" index="" />
          <h2 className={`mt-4 ${TYPE.sectionHeading} text-phosphor`}>
            From idea to live profile.
          </h2>
          <p className="mt-4 max-w-[620px] text-[18px] leading-[1.56] text-lichen">
            The bridge between liking the concept and imagining yourself using it.
          </p>
        </ScrollReveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:gap-16">
          <div className="space-y-6">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.title} delay={i * 0.06} y={32}>
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-reactor/40 bg-reactor/10 text-[13px] font-medium text-reactor">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-display text-[20px] font-medium text-phosphor md:text-[22px]">
                      {step.title}
                    </p>
                    <p className="mt-1 text-[15px] leading-relaxed text-lichen">{step.detail}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={0.12} scale={0.97} className="lg:sticky lg:top-28 lg:self-start">
            <div className="cc-build-flow rounded-[14px] border border-border/50 bg-midnight/70 p-6 shadow-rim md:p-8">
              <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-graphite">
                Onboarding preview
              </p>
              <p className="mt-3 font-display text-[24px] text-phosphor">Create your CodeCard</p>

              <div className="mt-6 space-y-2">
                {SOURCES.map((source) => (
                  <div
                    key={source}
                    className="cc-build-flow__row flex items-center justify-between rounded-[10px] border border-border/40 px-4 py-3"
                  >
                    <span className="text-[15px] text-lichen">{source}</span>
                    <span className="text-reactor" aria-hidden>
                      ✓
                    </span>
                  </div>
                ))}
              </div>

              <div className="cc-build-flow__arrow my-4 text-center text-graphite" aria-hidden>
                ↓
              </div>
              <p className="text-center text-[14px] font-medium text-reactor">Auto-imports</p>
              <div className="cc-build-flow__arrow my-4 text-center text-graphite" aria-hidden>
                ↓
              </div>

              <div className="rounded-[10px] border border-reactor/30 bg-reactor/5 p-4">
                <p className="text-[13px] text-graphite">Featured order</p>
                <div className="mt-3 space-y-2">
                  {['DevFlow', 'Pulse', 'SchemaSync'].map((p) => (
                    <div key={p} className="rounded-[8px] border border-border/30 bg-void-canvas/50 px-3 py-2 text-[14px] text-phosphor">
                      {p}
                    </div>
                  ))}
                </div>
              </div>

              <div className="cc-build-flow__arrow my-4 text-center text-graphite" aria-hidden>
                ↓
              </div>

              <div className="flex items-center gap-4 rounded-[10px] border border-border/40 p-4">
                <div className="h-16 w-16 shrink-0 rounded-[8px] border border-border/50 bg-white p-1">
                  <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-px bg-void-canvas">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className={i % 2 === 0 ? 'bg-void-canvas' : 'bg-white'} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[14px] font-medium text-phosphor">Publish & share QR</p>
                  <p className="mt-1 text-[13px] text-lichen">codecard.app/alex</p>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <MorphSignupCta layoutId="build-yours-cta" />
              </div>
              <Link
                href="/demo"
                className="mt-4 block text-center text-[14px] text-graphite transition-colors hover:text-reactor"
              >
                Or explore the live demo →
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
