import Link from 'next/link';
import { ResearchProvider } from '@/components/research/research-provider';
import { ResearchScrollStory } from '@/components/research/research-scroll-story';
import { ResearchThesisCard } from '@/components/research/research-thesis-card';
import { ResearchWhyCodecard } from '@/components/research/research-why-codecard';
import { HowItWorksSection } from './how-it-works-page';
import { ProductHero } from './product-hero';
import { ScrollReveal } from './scroll-reveal';
import { AuroraDivider } from './aurora-divider';
import { AudienceBounceCards } from '@/components/landing/audience-bounce-cards';
import { WorkspaceShowcase } from '@/components/landing/workspace-showcase';
import { BuildYoursSection } from '@/components/landing/build-yours-section';
import { SectionCounter } from './section-counter';
import { TYPE } from '@/lib/design/tokens';
import { TechStackSection } from '@/components/landing/tech-stack-section';

export function ProductPage() {
  return (
    <ResearchProvider>
      <div className="pb-16">
        <ProductHero />

        <AuroraDivider className="cc-container" />

        <section id="why-codecard" className="scroll-mt-28 py-16 md:py-24">
          <ResearchWhyCodecard />
        </section>

        <AuroraDivider className="cc-container" />

        <section className="py-20 md:py-[80px]">
          <div className="cc-container">
            <ScrollReveal parallax>
              <SectionCounter label="Who it's for" index="" />
              <h2 className={`mt-4 ${TYPE.sectionHeading} text-vellum`}>
                One card. Every audience.
              </h2>
              <p className={`mt-4 max-w-[560px] ${TYPE.subheading}`}>
                The same CodeCard works at a conference, in a recruiter inbox, on your portfolio, and beyond.
              </p>
            </ScrollReveal>
          </div>
          <AudienceBounceCards />
        </section>

        <AuroraDivider className="cc-container" />

        <WorkspaceShowcase />

        <AuroraDivider className="cc-container" />

        <section id="research" className="scroll-mt-28 py-[100px] md:py-[120px]">
          <div className="cc-container pb-6">
            <ScrollReveal>
              <SectionCounter index="03" label="Research" />
              <h2 className={`mt-6 ${TYPE.sectionHeading} text-phosphor`}>
                Why order matters.
              </h2>
              <p className="mt-6 max-w-[680px] text-[18px] leading-[1.56] text-lichen">
                Studies show people skim for seconds and fix on schools and titles first. The research
                cards below cite the sources.
              </p>
            </ScrollReveal>
          </div>

          <ResearchScrollStory />
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

        <AuroraDivider className="cc-container" />

        <TechStackSection />
      </div>
    </ResearchProvider>
  );
}
