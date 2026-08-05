import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ResearchProvider } from '@/components/research/research-provider';
import { ProductHero } from './product-hero';
import { HumeStatStrip } from './hume-stat-strip';
import { AuroraDivider } from './aurora-divider';
import { SectionCounter } from './section-counter';
import { TYPE } from '@/lib/design/tokens';
import { InteractiveSurfaceCard } from '@/components/interactions/interactive-surface-card';

/** Below-fold islands — keep initial `/` JS free of their client graphs until needed. */
const WorkspaceShowcase = dynamic(
  () => import('./workspace-showcase').then((m) => m.WorkspaceShowcase),
  { ssr: true, loading: () => <section className="scroll-mt-28 py-20 md:py-[100px]" aria-hidden /> },
);
const HowItWorksSection = dynamic(
  () => import('./how-it-works-page').then((m) => m.HowItWorksSection),
  { ssr: true },
);
const AudienceBounceCards = dynamic(
  () =>
    import('@/components/landing/audience-bounce-cards').then((m) => m.AudienceBounceCards),
  { ssr: true },
);
const BuildYoursSection = dynamic(
  () => import('@/components/landing/build-yours-section').then((m) => m.BuildYoursSection),
  { ssr: true },
);
const ResearchAlternatingRows = dynamic(
  () =>
    import('@/components/research/research-alternating-rows').then(
      (m) => m.ResearchAlternatingRows,
    ),
  { ssr: true },
);
const ResearchThesisCard = dynamic(
  () => import('@/components/research/research-thesis-card').then((m) => m.ResearchThesisCard),
  { ssr: true },
);
const ResearchWhyCodecard = dynamic(
  () => import('@/components/research/research-why-codecard').then((m) => m.ResearchWhyCodecard),
  { ssr: true },
);
const ScrollReveal = dynamic(
  () => import('./scroll-reveal').then((m) => m.ScrollReveal),
  { ssr: true },
);
const MotionSectionRevealProof = dynamic(
  () =>
    import('@/components/motion/section-reveal-proof').then((m) => m.MotionSectionRevealProof),
  { ssr: true },
);

export function ProductPage() {
  return (
    <ResearchProvider>
      <div className="pb-16">
        <ProductHero />
        <HumeStatStrip />

        <AuroraDivider className="cc-container" />

        <WorkspaceShowcase />

        <AuroraDivider className="cc-container" />

        <section id="research-support" className="scroll-mt-28 py-16 md:py-24">
          <div className="cc-container">
            <MotionSectionRevealProof>
              <SectionCounter label="Research support" index="" />
              <h2 className={`mt-4 ${TYPE.sectionHeading} text-ink`}>
                Showcase your research, not just your projects.
              </h2>
              <p className={`mt-5 max-w-[720px] ${TYPE.subheading}`}>
                Add papers, abstracts, citations, PDFs, publication status, and related technical
                work directly to your CodeCard.
              </p>
            </MotionSectionRevealProof>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: 'Research papers',
                  body: 'Present authors, venues, status, abstracts, keywords, and figures beside your software work.',
                },
                {
                  title: 'PDFs & citations',
                  body: 'Give visitors a clean PDF download and one-click citation copy without sending them elsewhere first.',
                },
                {
                  title: 'Related projects',
                  body: 'Connect a paper to the demo, repository, or system that proves the work in practice.',
                },
              ].map((card) => (
                <ScrollReveal key={card.title}>
                  <InteractiveSurfaceCard className="cc-surface-card h-full p-6" parallax={false}>
                    <h3 className="font-display text-[24px] tracking-[-0.03em] text-ink" data-enter-item>
                      {card.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-lichen">{card.body}</p>
                  </InteractiveSurfaceCard>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <AuroraDivider className="cc-container" />

        <section id="why-codecard" className="scroll-mt-28 py-16 md:py-24">
          <ResearchWhyCodecard />
        </section>

        <AuroraDivider className="cc-container" />

        <section className="py-20 md:py-[80px]">
          <div className="cc-container">
            <ScrollReveal parallax>
              <SectionCounter label="Who it's for" index="" />
              <h2 className={`mt-4 ${TYPE.sectionHeading} text-ink`}>
                Every intro.
              </h2>
              <p className={`mt-4 max-w-[560px] ${TYPE.subheading}`}>
                Share the same CodeCard by QR, link, or from your phone at a meetup or in a
                recruiter&apos;s inbox. They open it on their screen — your showcase, right there.
              </p>
            </ScrollReveal>
          </div>
          <AudienceBounceCards />
        </section>

        <AuroraDivider className="cc-container" />

        <section id="research" className="scroll-mt-28 py-[100px] md:py-[120px]">
          <div className="cc-container pb-10 md:pb-14">
            <ScrollReveal>
              <SectionCounter index="03" label="Research" />
              <h2 className={`mt-6 ${TYPE.sectionHeading} text-ink`}>
                Why order matters.
              </h2>
              <p className="mt-6 max-w-[680px] text-[18px] leading-[1.56] text-lichen">
                The problem is not your ability — it is what gets seen first. Each finding below pairs
                the human stakes with the study behind it.
              </p>
            </ScrollReveal>
          </div>

          <div className="cc-container">
            <ResearchAlternatingRows />
          </div>

          <ScrollReveal y={40}>
            <ResearchThesisCard />
          </ScrollReveal>

          <div className="cc-container py-12">
            <ScrollReveal>
              <div className="cc-surface-card p-10 text-center">
                <p className="text-[18px] text-lichen">Full bibliography with source details and limitations.</p>
                <Link
                  href="/research/references"
                  className="cc-btn-ghost mt-6 inline-flex text-reactor hover:text-phosphor"
                >
                  View all references →
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <AuroraDivider className="cc-container" />

        <HowItWorksSection />

        <AuroraDivider className="cc-container" />

        <BuildYoursSection />
      </div>
    </ResearchProvider>
  );
}
