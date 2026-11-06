import dynamic from 'next/dynamic';
import { EditorialHero } from './editorial-hero';
import { EditorialHeroScene } from './editorial-hero-scene';
import { EditorialFeatureWalkthrough } from './editorial-feature-walkthrough';
import { EditorialLiveDemoBox } from './editorial-live-demo-box';
import { EditorialAudience } from './editorial-audience';
import { EditorialFinalCta } from './editorial-final-cta';
import { EditorialWaitlist } from './editorial-waitlist';
import { OpeningCurtain } from './opening-curtain';
import '@/styles/editorial-landing.css';

const OPENING_GATE = `try{var d=document.documentElement,q=location.search.indexOf('intro')>-1;if(q){sessionStorage.removeItem('cc.open.seen')}if(!q&&(sessionStorage.getItem('cc.open.seen')||matchMedia('(prefers-reduced-motion: reduce)').matches)){d.classList.add('cc-intro-seen')}}catch(e){}`;

const EditorialAtmosphere = dynamic(
  () => import('./editorial-atmosphere').then((m) => m.EditorialAtmosphere),
  { ssr: true, loading: () => null },
);

const EditorialResearchScene = dynamic(
  () => import('./editorial-research-scene').then((m) => m.EditorialResearchScene),
  { ssr: true },
);

/**
 * Marketing `/`
 * Hero cinema (expand + statement reveal) → walkthrough → demo → audience → research → finale → waitlist.
 */
export function EditorialLanding() {
  return (
    <div className="cc-ed" data-testid="editorial-landing" data-chapter="hero">
      <script dangerouslySetInnerHTML={{ __html: OPENING_GATE }} />
      <OpeningCurtain />
      <EditorialAtmosphere />
      <EditorialHeroScene hero={<EditorialHero />} />
      <EditorialFeatureWalkthrough />
      <EditorialLiveDemoBox />
      <EditorialAudience />
      <EditorialResearchScene />
      <EditorialFinalCta />
      <EditorialWaitlist />
    </div>
  );
}
