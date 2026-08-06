import dynamic from 'next/dynamic';
import { EditorialHero } from './editorial-hero';
import { EditorialStatement } from './editorial-statement';
import { ProductStory } from './product-story';
import { EditorialNetworkBridge } from './editorial-network-bridge';
import { ProductAnalysisSection } from './product-analysis-section';
import { EditorialLiveDemoBox } from './editorial-live-demo-box';
import { EditorialAudience } from './editorial-audience';
import { EditorialResearchProof } from './editorial-research-proof';
import { EditorialFinalCta } from './editorial-final-cta';
import { LIVE_DEMO_HREF } from '@/lib/marketing/demo-url';
import '@/styles/editorial-landing.css';

const EditorialAtmosphere = dynamic(
  () => import('./editorial-atmosphere').then((m) => m.EditorialAtmosphere),
  { ssr: true, loading: () => null },
);

/**
 * Marketing `/`
 * Hero → statement → Projects / Research →
 * network bridge → Circle + Connections → Analysis →
 * live demo embed → Who it’s for → research proof → finale.
 */
export function EditorialLanding() {
  return (
    <div className="cc-ed" data-testid="editorial-landing" data-chapter="hero">
      <EditorialAtmosphere />
      <EditorialHero />
      <EditorialStatement />
      <ProductStory
        id="projects"
        chapter="projects"
        eyebrow="Projects"
        title={
          <>
            <span className="cc-ed__lead">CODING PROJECTS.</span>
            <span className="cc-ed__sub">IN ONE PLACE.</span>
          </>
        }
        body="Put the repos, demos, tech, and results people need to see in one project record they can scan in seconds."
        state="projects"
        size="lg"
        linkHref={`${LIVE_DEMO_HREF}/projects`}
        linkLabel="Open projects in the live demo →"
      />
      <ProductStory
        id="research"
        chapter="research"
        eyebrow="Research"
        title={
          <>
            <span className="cc-ed__lead">YOUR PAPERS.</span>
            <span className="cc-ed__sub">NOT JUST A PDF.</span>
          </>
        }
        body="Abstracts, methods, figures, collaborators, and findings in a real paper record people can open and skim in seconds."
        state="research"
        flip
        researchBoard
        size="lg"
        linkHref={`${LIVE_DEMO_HREF}/research`}
        linkLabel="Open research in the live demo →"
      />

      <EditorialNetworkBridge />

      <div
        className="cc-ed-network-pair"
        data-testid="editorial-network-pair"
      >
        <ProductStory
          id="circle"
          chapter="circle"
          eyebrow="Circle"
          title={
            <>
              <span className="cc-ed__lead">YOUR CIRCLE.</span>
              <span className="cc-ed__sub">THEIR PROJECTS.</span>
            </>
          }
          body="A feed of work from people you trust. See what they ship without digging through chats."
          state="circle"
          size="lg"
          linkHref={`${LIVE_DEMO_HREF}/circle`}
          linkLabel="Open Circle in the live demo →"
        />
        <ProductStory
          id="connections"
          chapter="connections"
          eyebrow="Connections"
          title={
            <>
              <span className="cc-ed__lead">PEOPLE YOU MET.</span>
              <span className="cc-ed__sub">NOTES THAT STICK.</span>
            </>
          }
          body="Save people from events, intros, and QR opens, with notes and follow ups you can actually use later."
          state="connections"
          flip
          size="lg"
          linkHref={`${LIVE_DEMO_HREF}/connections`}
          linkLabel="Open connections in the live demo →"
        />
      </div>

      <ProductAnalysisSection />
      <EditorialLiveDemoBox />
      <EditorialAudience />
      <EditorialResearchProof />
      <EditorialFinalCta />
    </div>
  );
}
