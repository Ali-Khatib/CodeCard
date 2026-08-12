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
    expect(hero).toContain('ONE IDENTITY.');
    expect(hero).toContain('cc-ed__lead');
    expect(hero).toContain('cc-ed__sub');
    expect(hero).toContain('cc-ed-hero__media');
    expect(hero).toContain('priority');
    expect(hero).not.toContain('LIVE_DEMO_PROFILE_HREF');
    expect(hero).not.toContain('View Public Profile');
  });

  it('uses a feature walkthrough instead of screenshot product stories', () => {
    const landing = read('src/components/landing/editorial/editorial-landing.tsx');
    expect(landing).toContain('EditorialFeatureWalkthrough');
    expect(landing).toContain('EditorialLiveDemoBox');
    expect(landing).toContain('EditorialAudience');
    expect(landing).toContain('EditorialResearchProof');
    expect(landing).not.toContain('ProductStory');
    expect(landing).not.toContain('ProductAnalysisSection');
    expect(landing).not.toContain('EditorialNetworkBridge');
    expect(landing).not.toContain('EditorialProductFrame');
    expect(landing).not.toContain('EditorialMovingCards');
    expect(landing).not.toContain('chapter="impact"');
  });

  it('walkthrough explains surfaces without dashboard frames', () => {
    const walk = read(
      'src/components/landing/editorial/editorial-feature-walkthrough.tsx',
    );
    expect(walk).toContain('EditorialFeatureWalkthrough');
    expect(walk).toContain('FullScreenScrollFX');
    expect(walk).toContain('Projects');
    expect(walk).toContain('Research');
    expect(walk).toContain('Circle');
    expect(walk).toContain('Connections');
    expect(walk).toContain('Analytics');
    expect(walk).toContain('PROJECTS PEOPLE CAN READ');
    expect(walk).toContain('SHARE YOUR RESEARCH TOO.');
    expect(walk).toContain('Not only projects');
    expect(walk).toContain('content:');
    expect(walk).toContain('photo-1461749280684-dccba630e2f6');
    expect(walk).toContain('photo-1497633762265-9d179a990aa6');
    expect(walk).toContain('photo-1514565131-fce0801e5785');
    expect(walk).toContain('Crash course');
    expect(walk).toContain('Five surfaces. Learn the card.');
    expect(walk).not.toContain('Walk the live product');
    expect(walk).not.toContain('Scroll to see');
    expect(walk).not.toContain('Five ways your work lives');
    expect(walk).not.toContain('NOT JUST A PDF');
    expect(walk).not.toContain('Yes, you can show research too');
    expect(walk).not.toContain('photo-1551288049-bebda4e38f71');
    expect(walk).not.toContain('EditorialProductFrame');
    expect(walk).not.toContain('DashboardConnectionsView');
  });

  it('research proof uses three sticky image fades with centered copy', () => {
    const proof = read(
      'src/components/landing/editorial/editorial-research-proof.tsx',
    );
    const parallax = read('src/components/ui/text-parallax-content-scroll.tsx');
    expect(proof).toContain('TextParallaxContent');
    expect(parallax).toContain('StickyImage');
    expect(parallax).toContain('OverlayCopy');
    expect(proof).toContain('THEY DO NOT READ YOU.');
    expect(proof).toContain('Your best work never gets the glance.');
    expect(proof).toContain('Your school can decide first.');
    expect(proof).toContain('Hidden skills get skipped.');
    expect(proof).toContain('research=');
    expect(proof).toContain('solution=');
    expect(proof).toContain('images.unsplash.com');
    expect(proof).toContain('photo-1450101499163-c8848c66ca85');
    expect(proof).toContain('photo-1562774053-701939374585');
    expect(proof).toContain('photo-1627398242454-45a1465c2479');
    expect(proof).not.toContain('photo-1551836022-d5d88e9218df');
    expect(proof).not.toContain('They look. Then they decide.');
    expect(proof).not.toContain('auth-demo/');
    expect(proof).not.toContain('auth-collage/');
    expect(proof).not.toContain('1522071820081');
    expect(proof).not.toContain('photo-1461749280684-dccba630e2f6');
    expect(proof).not.toContain('+15 pts');
    expect(proof).not.toContain('In one study');
    expect(proof).toContain('See all research papers');
  });

  it('embeds the live demo workspace in an iframe', () => {
    const demo = read('src/components/landing/editorial/editorial-live-demo-box.tsx');
    const css = read('src/styles/editorial-landing.css');
    expect(demo).toContain('iframe');
    expect(demo).toContain('src="/demo?embed=1"');
    expect(demo).toContain('loading="eager"');
    expect(demo).toContain('cc-ed-walk__bridge--out');
    expect(demo).not.toContain('IntersectionObserver');
    expect(demo).not.toContain('LIVE_DEMO_PROFILE_HREF');
    expect(css).toMatch(/\.cc-ed-demo-embed\s*\{[\s\S]*?transparent/);
    expect(css).toContain("data-chapter='demo'");
    expect(css).toMatch(/\.cc-ed-walk__bridge--out\s*\{[\s\S]*?--ed-cream/);
    expect(css).toMatch(/width:\s*min\(92rem,\s*100%\)/);
    expect(css).toMatch(/height:\s*min\(82vh,\s*860px\)/);
    expect(css).not.toMatch(/aspect-ratio:\s*1\s*\/\s*1/);
    expect(css).not.toMatch(/width:\s*min\(22rem,/);
  });

  it('keeps final CTA without public profile', () => {
    const closing = read('src/components/landing/editorial/editorial-final-cta.tsx');
    expect(closing).toContain('LiveDemoLink');
    expect(closing).toContain('/sign-up');
    expect(closing).not.toContain('LIVE_DEMO_PROFILE_HREF');
  });

  it('morphs the marketing pill into a menu circle instead of clipping CodeCard', () => {
    const framer = read('src/components/ui/animated-nav-framer.tsx');
    const shell = read('src/components/landing/landing-shell-nav.tsx');
    const hero = read('src/components/landing/landing-hero-nav.tsx');
    const css = read('src/app/globals.css');
    expect(framer).toContain('AnimatedNavFramer');
    expect(framer).toContain('from \'lucide-react\'');
    expect(framer).toContain('<Menu');
    expect(framer).toContain('NAV_COLLAPSED_SIZE');
    expect(framer).toContain('scrollWidth');
    expect(shell).not.toContain('morphNavVeil');
    expect(shell).not.toContain('data-nav-morphing');
    expect(hero).toContain('AnimatedNavFramer');
    expect(hero).not.toContain('cc-nav-compact-trigger');
    expect(css).toContain('pointer-events: none');
    expect(css).toMatch(/\.cc-nav-veil--collapsed[\s\S]*?background:\s*transparent/);
    expect(css).toContain("html[data-nav-compact='true'] .cc-marketing-nav-shell");
    expect(css).toMatch(
      /html\[data-nav-compact='true'\] \.cc-marketing-nav-shell[\s\S]*?justify-content:\s*center/,
    );
    expect(framer).toContain("background: 'transparent'");
  });
});
