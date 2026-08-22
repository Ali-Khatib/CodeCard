import dynamic from 'next/dynamic';
import { EditorialHero } from './editorial-hero';
import { EditorialStatement } from './editorial-statement';
import { EditorialFeatureWalkthrough } from './editorial-feature-walkthrough';
import { EditorialLiveDemoBox } from './editorial-live-demo-box';
import { EditorialAudience } from './editorial-audience';
import { EditorialFinalCta } from './editorial-final-cta';
import { EditorialStickyMobileCta } from './editorial-sticky-mobile-cta';
import '@/styles/editorial-landing.css';

const EditorialAtmosphere = dynamic(
  () => import('./editorial-atmosphere').then((m) => m.EditorialAtmosphere),
  { ssr: true, loading: () => null },
);

const EditorialHeroScene = dynamic(
  () => import('./editorial-hero-scene').then((m) => m.EditorialHeroScene),
  { ssr: true },
);

const EditorialResearchScene = dynamic(
  () => import('./editorial-research-scene').then((m) => m.EditorialResearchScene),
  { ssr: true },
);

/**
 * Marketing `/`
 * Hero scene → walkthrough → live demo preview → audience → research → finale.
 */
export function EditorialLanding() {
  return (
    <div className="cc-ed" data-testid="editorial-landing" data-chapter="hero">
      <EditorialAtmosphere />
      <EditorialHeroScene hero={<EditorialHero />} statement={<EditorialStatement />} />
      <EditorialFeatureWalkthrough />
      <EditorialLiveDemoBox />
      <EditorialAudience />
      <EditorialResearchScene />
      <EditorialFinalCta />
      <EditorialStickyMobileCta />
    </div>
  );
}
