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
            <span className="cc-ed__lead">SHOW WHAT</span>
            <span className="cc-ed__sub">YOU BUILT.</span>
          </>
        }
        body="Present the problem, process, technologies, media, links, and results in one clear project record."
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
            <span className="cc-ed__lead">RESEARCH DESERVES</span>
            <span className="cc-ed__sub">MORE THAN A PDF LINK.</span>
          </>
        }
        body="Give papers, methods, diagrams, collaborators, and findings a professional home."
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
              <span className="cc-ed__lead">STAY CLOSE TO</span>
              <span className="cc-ed__sub">THE PEOPLE WHO MATTER.</span>
            </>
          }
          body="Circle keeps trusted peers, shared work, and quiet updates in one calm feed."
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
              <span className="cc-ed__lead">REMEMBER WHO</span>
              <span className="cc-ed__sub">YOU ACTUALLY MET.</span>
            </>
          }
          body="Capture people from events, intros, and QR opens—with notes and follow-ups that stay useful."
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
