import dynamic from 'next/dynamic';
import { EditorialHero } from './editorial-hero';
import { EditorialHeroScene } from './editorial-hero-scene';
import { EditorialFeatureWalkthrough } from './editorial-feature-walkthrough';
import { EditorialLiveDemoBox } from './editorial-live-demo-box';
import { EditorialFinalCta } from './editorial-final-cta';
import { EditorialWaitlist } from './editorial-waitlist';
import '@/styles/editorial-landing.css';

const EditorialAtmosphere = dynamic(
  () => import('./editorial-atmosphere').then((m) => m.EditorialAtmosphere),
  { ssr: true, loading: () => null },
);

/**
 * Marketing `/`
 * Hero cinema (expand + statement reveal) → walkthrough → demo → finale → waitlist.
 */
export function EditorialLanding() {
  return (
    <div className="cc-ed" data-testid="editorial-landing" data-chapter="hero">
      <EditorialAtmosphere />
      <EditorialHeroScene hero={<EditorialHero />} />
      <EditorialFeatureWalkthrough />
      <EditorialLiveDemoBox />
      <EditorialFinalCta />
      <EditorialWaitlist />
    </div>
  );
}
