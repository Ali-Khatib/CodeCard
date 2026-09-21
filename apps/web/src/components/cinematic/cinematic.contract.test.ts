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
    expect(hero).toContain('SHARE YOUR WORK.');
    expect(hero).toContain('KEEP THE CONNECTION.');
    expect(hero).toContain(
      'Where your work meets your people, and introductions become',
    );
    expect(hero).not.toContain('Open it on your phone, or they scan the QR.');
    expect(hero).not.toContain('scan your QR.');
    expect(hero).not.toContain('YOUR PHONE.');
    expect(hero).not.toContain('Hand them your phone.');
    expect(hero).toContain('EditorialHeroAnimatedHeadline');
    const rotator = read(
      'src/components/landing/editorial/editorial-hero-animated-headline.tsx',
    );
    expect(rotator).toContain('BUILD A');
    expect(rotator).toContain('CONNECTION.');
    expect(rotator).toContain('MAKE AN');
    expect(rotator).toContain('IMPACT.');
    expect(rotator).toContain('LEAVE A');
    expect(rotator).toContain('MARK.');
    expect(rotator).toContain('AnimatePresence');
    expect(rotator).not.toContain('KEEP THE');
    expect(rotator).not.toContain('CONTEXT');
    expect(rotator).not.toContain('HISTORY');
    /* The shader field belongs to the scene now — shared with the statement. */
    expect(hero).not.toContain('cc-ed-hero__media');
    expect(hero).not.toContain('ShaderHeroBackdrop');
    expect(hero).not.toContain('priority');
    expect(hero).not.toContain('images.unsplash.com');
    expect(hero).not.toContain('LIVE_DEMO_PROFILE_HREF');
    expect(hero).not.toContain('View Public Profile');
  });

  it('uses a feature walkthrough instead of screenshot product stories', () => {
    const landing = read('src/components/landing/editorial/editorial-landing.tsx');
    expect(landing).toContain('EditorialFeatureWalkthrough');
    expect(landing).toContain('EditorialLiveDemoBox');
    expect(landing).toContain('EditorialAudience');
    expect(landing).toContain('EditorialResearchScene');
    expect(landing).toContain('EditorialWaitlist');
    expect(landing).not.toContain('EditorialFaq');
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
    expect(walk).toContain('ScrollTriggeredVideoHero');
    expect(walk).toContain('Projects');
    expect(walk).toContain('Research');
    expect(walk).toContain('Circle');
    expect(walk).toContain('Connections');
    expect(walk).toContain('Analytics');
    expect(walk).toContain('The work, in the room.');
    expect(walk).toContain('Papers on the same card.');
    expect(walk).toContain('Context on the person.');
    expect(walk).toContain('Venue on the connection.');
    expect(walk).toContain('A private circle.');
    expect(walk).toContain('What the scan opened.');
    expect(walk).toContain('videos.pexels.com/video-files');
    expect(walk).toContain('4974774-hd_1920_1080_25fps');
    expect(walk).toContain('6549981-hd_1920_1080_25fps');
    expect(walk).toContain('4484270-hd_1920_1080_25fps');
    expect(walk).toContain('8716585-hd_1920_1080_25fps');
    expect(walk).toContain('8426060-hd_1920_1080_25fps');
    expect(walk).toContain('7947507-hd_1920_1080_30fps');
    expect(walk).not.toContain('3129671-hd_1920_1080_30fps');
    expect(walk).not.toContain('7647451-hd_720_1280_24fps');
    expect(walk).not.toContain('854998-hd_1280_720_24fps');
    expect(walk).not.toContain('5438985-uhd_2160_3840');
    const nextConfig = read('next.config.ts');
    expect(nextConfig).toContain('https://videos.pexels.com');
    expect(walk).toContain('Crash course');
    expect(walk).toContain('EditorialComparison');
    expect(walk).not.toContain('FullScreenScrollFX');
    expect(walk).not.toContain('Walk the live product');
    expect(walk).not.toContain('Scroll to see');
    expect(walk).not.toContain('Five ways your work lives');
    expect(walk).not.toContain('NOT JUST A PDF');
    expect(walk).not.toContain('Yes, you can show research too');
    expect(walk).not.toContain('photo-1551288049-bebda4e38f71');
    expect(walk).not.toContain('EditorialProductFrame');
    expect(walk).not.toContain('DashboardConnectionsView');
    const crash = read('src/components/ui/scroll-triggered-video-hero.tsx');
    expect(crash).toContain('ScrollTriggeredVideoHero');
    expect(crash).toContain('<video');
    expect(crash).not.toContain('EditorialLivePeekButton');
    expect(crash).not.toContain('cc-ed-crash__chapters');
    expect(crash).toContain('chapterIndexFromProgress');
    expect(crash).toContain('editorial-crash-snap');
    expect(crash).toContain('inertia: false');
    expect(crash).toContain('CHAPTER_VH = 80');
    expect(crash).toContain('autoPlay={active}');
    expect(crash).toContain('data-chrome-surface="dark"');
    const chrome = read(
      'src/components/landing/editorial/landing-chrome-tone.ts',
    );
    const atmosphere = read(
      'src/components/landing/editorial/editorial-atmosphere.tsx',
    );
    expect(chrome).toContain('syncLandingChromeFromPage');
    expect(chrome).toContain('.cc-ed-crash__pin');
    expect(atmosphere).toContain('syncLandingChromeFromPage');
    expect(crash).not.toContain('AnimatePresence');
    expect(crash).not.toContain('PlayCircle');
    expect(crash).not.toContain('Explore Sequence');
    expect(crash).not.toContain('DynamicNav');
    expect(walk).toContain("id: 'projects'");
    expect(walk).toContain("id: 'research'");
    expect(walk).toContain("id: 'connections'");
    expect(walk).toContain("id: 'events'");
    expect(walk).toContain("id: 'circle'");
    expect(walk).toContain("id: 'analytics'");
    expect(walk.match(/videoUrl:/g)?.length).toBe(6);
    const css = read('src/styles/editorial-landing.css');
    expect(css).toContain('.cc-ed-crash__frame');
    expect(css).toContain('.cc-ed-crash__veil');
    expect(css).toContain('.cc-ed-crash__pin');
    expect(css).toContain('conic-gradient');
    expect(css).toContain('max-width: 72rem');
  });

  it('research proof uses three editorial beats with redaction reveal and cream wash', () => {
    const proof = read(
      'src/components/landing/editorial/editorial-research-scene.tsx',
    );
    const story = read('src/components/ui/editorial-research-story.tsx');
    const css = read('src/styles/editorial-landing.css');
    expect(proof).toContain('EditorialResearchStory');
    expect(proof).toContain('beats={BEATS}');
    expect(proof).toContain('Attention window');
    expect(proof).toContain('Prestige bias');
    expect(proof).toContain('Skills visibility');
    expect(proof).toContain('backgroundColor: wash');
    expect(proof).toContain('#fcf1e7');
    expect(proof).toContain('The research');
    expect(proof).toContain('Early review can be extremely brief.');
    expect(proof).toContain('/auth-collage/team.jpg');
    expect(proof).toContain('/auth-collage/desk.jpg');
    expect(proof).toContain('/auth-collage/code.jpg');
    expect(proof).not.toContain('images.unsplash.com');
    expect(story).toContain('EditorialResearchStory');
    expect(story).toContain('cc-ed-research-story__beat');
    expect(story).toContain('cc-ed-research-redact__mask');
    expect(story).toContain('data-research-reveal');
    expect(story).toContain('cc-ed-research-story__media');
    expect(story).toContain('cc-ed-research-story__columns');
    expect(story).toContain('cc-ed-research-story__cta-group');
    expect(story).toContain('useScroll');
    expect(story).toContain('useTransform');
    expect(story).toContain('Learn more about the research');
    expect(story).not.toContain('cc-ed-research-story__pager');
    expect(story).not.toContain('Keep scrolling');
    expect(story).not.toContain('pin: true');
    expect(story).not.toContain('autoAlpha');
    expect(css).toContain('.cc-ed-research-redact__mask');
    expect(css).toContain('.cc-ed-research-story__beat');
    expect(css).toContain('.cc-ed-research-story__grid');
    expect(css).toContain('.cc-ed-research-story__media');
    expect(css).not.toContain('.cc-ed-research-story__pin');
    expect(css).not.toContain('Keep scrolling');
    expect(proof).not.toContain('TextParallaxContent');
    expect(proof).not.toContain('photo-1450101499163-c8848c66ca85');
    expect(proof).not.toContain('THEY DO NOT');
  });

  it('embeds a full live demo preview with web/mobile toggle and delayed invitation', () => {
    const demo = read('src/components/landing/editorial/editorial-live-demo-box.tsx');
    const preview = read('src/components/landing/editorial/editorial-live-demo-preview.tsx');
    const css = read('src/styles/editorial-landing.css');
    expect(demo).toContain('EditorialLiveDemoPreview');
    expect(preview).toContain('iframe');
    expect(preview).toContain('/demo?embed=1');
    expect(preview).not.toContain('/demo/card?embed=1');
    expect(preview).toContain('DESKTOP_VIEW');
    expect(preview).toContain('width: 1440');
    expect(preview).toContain('MOBILE_VIEW');
    expect(preview).toContain('width: 390');
    expect(preview).toContain('Math.min(availW / inner.width, availH / inner.height, 1)');
    expect(preview).not.toContain('WEB_NARROW_BREAKPOINT');
    expect(preview).not.toContain('PHONE_WORKSPACE_VIEW');
    expect(preview).toContain('Desktop');
    expect(preview).toContain('Mobile');
    const peek = read('src/components/landing/editorial/editorial-live-peek-button.tsx');
    expect(preview).toContain('EditorialLivePeekButton');
    expect(peek).toContain('Take a quick peek at CodeCard');
    expect(preview).toContain('OPEN THE FULL WORKSPACE');
    expect(preview).toContain('View live demo');
    expect(demo).toContain('cc-ed-walk__bridge--out');
    expect(demo).not.toContain('LIVE_DEMO_PROFILE_HREF');
    expect(css).toContain('.cc-ed-demo-preview__device');
    const nextConfig = read('next.config.ts');
    expect(nextConfig).toContain("source: '/demo/:path*'");
    expect(nextConfig).toContain("frame-ancestors ${frameAncestors}");
    expect(nextConfig).toContain("source: '/((?!demo(?:/|$)|dashboard/preview(?:/|$)).*)'");
    expect(nextConfig).not.toContain("source: '/(.*)'");
    expect(css).toContain('.cc-ed-hero-scene');
    expect(css).toContain('.cc-ed-hero-scene--enhanced');
    expect(css).toContain('page frame is clip-path only');
    expect(css).toContain('.cc-ed-research-scene');
    expect(css).toContain('.cc-ed-research-story');
  });

  it('keeps a floating glass pill nav and a hero cinema statement reveal', () => {
    const css = read('src/styles/editorial-landing.css');
    const landing = read(
      'src/components/landing/editorial/editorial-landing.tsx',
    );
    const scene = read(
      'src/components/landing/editorial/editorial-hero-scene.tsx',
    );
    expect(css).toContain('Floating transparent rounded frame over the hero');
    expect(css).not.toContain('Dedicated editorial nav strip');
    expect(css).not.toMatch(
      /\.cc-marketing-nav-shell \.cc-nav-veil \{[\s\S]*?border-radius:\s*0\s*!important/,
    );
    expect(css).toContain('.cc-ed-hero-scene__runway');
    /* Statement is its own section below the hero with a sticky pin. */
    expect(css).toContain('.cc-ed-hero-scene__statement {');
    expect(css).toContain('.cc-ed-hero-scene__statement-pin');
    expect(css).not.toContain('.cc-ed-hero-scene__statement-overlay');
    expect(css).not.toContain('.cc-ed-hero-scene__statement-veil');
    expect(css).toContain('min-height: 100svh');
    expect(css).not.toContain('min-height: 620vh');
    expect(landing).not.toContain('EditorialStatementScene');
    expect(landing).toContain('EditorialHeroScene');
    expect(scene).toContain('data-statement-beat');
    expect(scene).toContain('data-statement-word');
    expect(scene).toContain(' / 03');
    expect(scene).toContain('Put your work in the room.');
    expect(scene).toContain('scan your QR');
    expect(scene).toContain('Be more than your title.');
    expect(scene).toContain("Don't lose the connection.");
    expect(scene).toContain('The moment you meet');
    expect(scene).toContain('cc-ed-hero-scene__statement-body');
    expect(scene).toContain('How it works');
    expect(scene).toContain('cc-ed-hero-scene__statement-tag');
    expect(scene).toContain('cc-ed-hero-scene__statement-lead');
    expect(scene).toContain('cc-ed-hero-scene__statement-sub');
    expect(scene).not.toContain('YOUR BEST WORK SHOULDN');
    expect(scene).not.toContain('FIVE PLACES');
    expect(scene).toContain('progressFillRef');
    expect(scene).toContain('data-statement-progress-fill');
    expect(scene).toContain('cc-ed-hero-scene__statement-progress');
    expect(css).toContain('.cc-ed-hero-scene__statement-stage');
    expect(css).toContain('All groups share one slot');
    expect(css).toContain('.cc-ed-hero-scene__statement-progress-fill');
    expect(scene).not.toContain('BEAT_EXIT_LIFT');
    expect(css).toContain('Instrument Serif');
    expect(css).toContain('--cc-ed-nav-clearance');
    expect(css).not.toContain('--cc-ed-hero-nav-gap');
    expect(css).not.toContain('--cc-ed-hero-offset');
    expect(css).toContain('--cc-ed-cinema-inset');
    expect(css).toContain('--cc-ed-cinema-radius');
    expect(css).toContain('cream/orange');
    expect(scene).toContain('clipPath');
    expect(scene).toContain('scrollClipClosed');
    expect(scene).not.toContain('introClipShut');
    expect(scene).not.toContain('INTRO_DURATION');
    expect(scene).not.toContain('INTRO_EASE');
    expect(scene).not.toContain("dataset.heroIntro = 'running'");
    expect(scene).not.toContain('onComplete: markIntroDoneAndBuild');
    expect(scene).not.toContain('holdForIntro');
    expect(scene).toContain('codecard:hero-cinema-ready');
    expect(scene).toContain('scrub: CINEMA_SCRUB');
    expect(scene).toContain('EXPAND_SCROLL_VH');
    expect(scene).toContain('STATEMENT_SCROLL_VH');
    expect(scene).toContain('runwayTotalVh');
    expect(scene).toContain('buildStatementReveal');
    expect(scene).toContain('BEAT_FILL_SHARE');
    /* Word fill (reading-text-reveal), pure cross-fade, one linear bar. */
    expect(scene).toContain('data-revealed');
    expect(scene).toContain('STATEMENT_WORD_LERP');
    expect(scene).toContain('revealedWordCount');
    expect(scene).toContain("from '@/components/ui/reading-text-reveal'");
    expect(scene).not.toContain('data-statement-char');
    expect(scene).not.toContain('STATEMENT_CHAR_DIM');
    expect(scene).not.toContain('STATEMENT_CHAR_LIT');
    const reveal = read('src/components/ui/reading-text-reveal.tsx');
    expect(reveal).toContain('export function revealedWordCount');
    expect(css).toContain("[data-revealed='true']");
    expect(css).not.toContain('.cc-ed-hero-scene__statement-char');
    expect(scene).toContain('statementTotalVh');
    expect(scene).toContain("start: 'top top'");
    /* Nothing about the handoff may be faked with transforms. */
    expect(scene).not.toContain('BEAT_ENTER_Y');
    expect(scene).not.toContain('BEAT_EXIT_Y');
    expect(scene).not.toContain('HERO_EXIT_Y');
    expect(scene).not.toContain('STATEMENT_ENTER_Y');
    expect(scene).not.toContain('yPercent');
    expect(scene).not.toContain('pin: stage');
    expect(scene).not.toContain('pin: panel');
    expect(scene).not.toContain('statementTls');
    expect(scene).not.toContain('setStatementProgress');
    expect(scene).not.toContain('STATEMENT_PIN_SCROLL');
    expect(scene).toContain('lockFinalGeometry');
    expect(scene).toContain("marginTop = '0'");
    expect(scene).toContain('const h = viewportH()');
    expect(scene).not.toContain('chromeOffset');
    expect(scene).toContain('setCinemaInset');
    expect(scene).toContain('--cc-ed-cinema-inset');
    expect(scene).toContain('EXPAND_CLIP_END = 1');
    expect(scene).toContain('editorial-hero-statement');
    expect(scene).toContain('cc-ed-hero-scene__runway');
    expect(scene).toContain('inset(${p}px');
    expect(scene).not.toContain('inset(50% 50% 50% 50%');
    expect(scene).not.toContain('inset(4.5%');
    expect(scene).not.toContain('finishIntro');
    expect(css).toContain('padding: 0');
    expect(css).not.toContain('inset(50% 50% 50% 50%');
    expect(css).not.toContain('width: 88%');
    expect(css).not.toContain('width: 96.5%');
    expect(scene).toContain('revertOnUpdate: false');
    expect(scene).toContain('data-hero-intro="settled"');
    expect(scene).toContain('cc-ed-hero-scene__bridge-out');
    expect(css).toContain('.cc-ed-hero-scene__bridge-out');
    expect(css).toContain("[data-hero-intro='pending']");
    /*
     * ONE shader field, owned by the scene and shared by the hero and the
     * statement. Two viewport-sized fields butting together is what seamed.
     */
    expect(scene).toContain('ShaderHeroBackdrop');
    expect(scene.match(/<ShaderHeroBackdrop/g)?.length).toBe(1);
    expect(scene).toContain('cc-ed-hero-scene__field-inner');
    expect(scene).toContain('cc-ed-hero-scene__letterbox');
    expect(scene).toContain('clipped = [stage, field]');
    expect(css).toContain('.cc-ed-hero-scene__field-inner');
    expect(css).toContain('.cc-ed-hero-scene__letterbox');
    /* The statement must not paint its own field. */
    expect(css).not.toContain('.cc-ed-hero-scene__statement-pin::before');
    expect(scene).toContain('refreshScrollTrigger');
    expect(scene).not.toContain('anticipatePin');
    expect(scene).not.toContain("backgroundColor: 'transparent'");
    expect(landing).toContain("from './editorial-hero-scene'");
  });

  it('keeps final CTA without public profile', () => {
    const closing = read('src/components/landing/editorial/editorial-final-cta.tsx');
    expect(closing).toContain('LiveDemoLink');
    expect(closing).toContain('/sign-up');
    expect(closing).not.toContain('LIVE_DEMO_PROFILE_HREF');
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
