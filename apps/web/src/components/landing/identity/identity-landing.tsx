import dynamic from 'next/dynamic';
import { IdentityHero } from './identity-hero';
import { IdentityFinale } from './identity-finale';
import { SectionCounter } from '../section-counter';
import { AuroraDivider } from '../aurora-divider';
import { TYPE } from '@/lib/design/tokens';
import '@/styles/cinematic-identity.css';

const IdentityAssembly = dynamic(
  () => import('./identity-assembly').then((m) => m.IdentityAssembly),
  {
    ssr: true,
    loading: () => (
      <section
        className="scroll-mt-28 py-20"
        aria-label="Identity assembly"
        data-testid="identity-assembly-fallback"
      />
    ),
  },
);

const HowItWorksSection = dynamic(
  () => import('../how-it-works-page').then((m) => m.HowItWorksSection),
  { ssr: true },
);

const AudienceBounceCards = dynamic(
  () => import('../audience-bounce-cards').then((m) => m.AudienceBounceCards),
  { ssr: true },
);

const HumeStatStrip = dynamic(
  () => import('../hume-stat-strip').then((m) => m.HumeStatStrip),
  { ssr: true },
);

/**
 * Marketing `/` — longer educational story:
 * Hero → assembly → stats → QR growing page → five audience cards → finale.
 * No corner “inspect” toy card.
 */
export function IdentityLanding() {
  return (
    <div className="cc-id pb-16" data-testid="identity-landing">
      <IdentityHero />

      <IdentityAssembly />

      <HumeStatStrip />

      <AuroraDivider className="cc-container" />

      <HowItWorksSection />

      <AuroraDivider className="cc-container" />

      <section className="scroll-mt-28 py-20 md:py-[80px]" data-testid="identity-audience">
        <div className="cc-container">
          <SectionCounter label="Who it's for" index="" />
          <h2 className={`mt-4 ${TYPE.sectionHeading} text-ink`}>Five ways people use CodeCard.</h2>
          <p className={`mt-4 max-w-[560px] ${TYPE.subheading}`}>
            Same living profile — whether you are pitching, recruiting, networking, learning, or
            freelancing.
          </p>
        </div>
        <AudienceBounceCards />
      </section>

      <AuroraDivider className="cc-container" />

      <IdentityFinale />
    </div>
  );
}
