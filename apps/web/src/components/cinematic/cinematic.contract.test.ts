import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (path: string) => readFileSync(resolve(WEB, path), 'utf8');

describe('Editorial product landing contract', () => {
  it('wires editorial landing only into the marketing ProductPage', () => {
    const page = read('src/components/landing/product-page.tsx');
    expect(page).toContain('EditorialLanding');
    expect(page).not.toContain('IdentityLanding');
  });

  it('keeps hero LCP rules and removes public-profile CTA', () => {
    const hero = read('src/components/landing/editorial/editorial-hero.tsx');
    expect(hero).toContain('data-hero-statement');
    expect(hero).toContain('YOUR WORK.');
    expect(hero).not.toContain('LIVE_DEMO_PROFILE_HREF');
    expect(hero).not.toContain('View Public Profile');
  });

  it('includes analysis, circle, connections, live demo, audience, and research proof', () => {
    const landing = read('src/components/landing/editorial/editorial-landing.tsx');
    expect(landing).toContain('ProductAnalysisSection');
    expect(landing).toContain('EditorialNetworkBridge');
    expect(landing).toContain('EditorialLiveDemoBox');
    expect(landing).toContain('EditorialAudience');
    expect(landing).toContain('EditorialResearchProof');
    expect(landing).toContain('editorial-network-pair');
    expect(landing).toContain('circle');
    expect(landing).toContain('connections');
    expect(landing).toContain('researchBoard');
    expect(landing).not.toContain('EditorialMovingCards');
    expect(landing).not.toContain('chapter="impact"');
  });

  it('keeps product stories copy-led without right-side product frames', () => {
    const story = read('src/components/landing/editorial/product-story.tsx');
    expect(story).not.toContain('EditorialProductFrame');
    expect(story).toContain('cc-ed-story__copy--solo');
  });

  it('embeds the live demo workspace in an iframe', () => {
    const demo = read('src/components/landing/editorial/editorial-live-demo-box.tsx');
    expect(demo).toContain('iframe');
    expect(demo).toContain('src="/demo"');
    expect(demo).not.toContain('LIVE_DEMO_PROFILE_HREF');
  });

  it('labels analysis instead of impact in the product frame', () => {
    const frame = read('src/components/landing/editorial/editorial-product-frame.tsx');
    expect(frame).toContain("label: 'Analysis'");
    expect(frame).toContain("state === 'analysis'");
    expect(frame).not.toContain("label: 'Impact'");
  });

  it('keeps final CTA without public profile', () => {
    const closing = read('src/components/landing/editorial/editorial-final-cta.tsx');
    expect(closing).toContain('LiveDemoLink');
    expect(closing).toContain('/sign-up');
    expect(closing).not.toContain('LIVE_DEMO_PROFILE_HREF');
  });
});
