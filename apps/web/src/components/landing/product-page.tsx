import Link from 'next/link';
import { ResearchProvider } from '@/components/research/research-provider';
import { ResearchAlternatingRows } from '@/components/research/research-alternating-rows';
import { ResearchThesisCard } from '@/components/research/research-thesis-card';
import { ResearchWhyCodecard } from '@/components/research/research-why-codecard';
import { HowItWorksSection } from './how-it-works-page';
import { ProductHero } from './product-hero';
import { HumeStatStrip } from './hume-stat-strip';
import { ScrollReveal } from './scroll-reveal';
import { AuroraDivider } from './aurora-divider';
import { AudienceBounceCards } from '@/components/landing/audience-bounce-cards';
import { BuildYoursSection } from '@/components/landing/build-yours-section';
import { WorkspaceShowcase } from '@/components/landing/workspace-showcase';
import { SectionCounter } from './section-counter';
import { TYPE } from '@/lib/design/tokens';

export function ProductPage() {
  return (
    <ResearchProvider>
      <div className="pb-16">
        <ProductHero />
        <HumeStatStrip />

        <AuroraDivider className="cc-container" />

        <WorkspaceShowcase />

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
