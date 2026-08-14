import dynamic from 'next/dynamic';
import { EditorialHero } from './editorial-hero';
import { EditorialStatement } from './editorial-statement';
import { EditorialFeatureWalkthrough } from './editorial-feature-walkthrough';
import { EditorialLiveDemoBox } from './editorial-live-demo-box';
import { EditorialAudience } from './editorial-audience';
import { EditorialResearchProof } from './editorial-research-proof';
import { EditorialFinalCta } from './editorial-final-cta';
import { EditorialStickyMobileCta } from './editorial-sticky-mobile-cta';
import '@/styles/editorial-landing.css';

const EditorialAtmosphere = dynamic(
  () => import('./editorial-atmosphere').then((m) => m.EditorialAtmosphere),
  { ssr: true, loading: () => null },
);

/**
 * Marketing `/`
 * Hero → statement → feature walkthrough →
 * live demo embed → Who it’s for → research proof → finale.
 */
export function EditorialLanding() {
  return (
    <div className="cc-ed" data-testid="editorial-landing" data-chapter="hero">
      <EditorialAtmosphere />
      <EditorialHero />
      <EditorialStatement />
      <EditorialFeatureWalkthrough />
      <EditorialLiveDemoBox />
      <EditorialAudience />
      <EditorialResearchProof />
      <EditorialFinalCta />
      <EditorialStickyMobileCta />
    </div>
  );
}
