import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GUIDE_SECTIONS } from './guide-content';
import { MARKETING_GUIDE_HREF } from './site-routes';

const WEB = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(WEB, path), 'utf8');

describe('marketing Guide walkthrough', () => {
  it('covers every live-demo sidebar tab', () => {
    expect(MARKETING_GUIDE_HREF).toBe('/guide');
    expect(GUIDE_SECTIONS.map((section) => section.nav)).toEqual([
      'Home',
      'Work',
      'Connections',
      'Circle',
      'Analytics',
      'Settings',
    ]);
    expect(GUIDE_SECTIONS.find((section) => section.id === 'connections')?.lead).toContain(
      'scans your QR',
    );
    expect(GUIDE_SECTIONS.find((section) => section.id === 'work')?.points.join(' ')).toContain(
      'mini presentation',
    );
    const analytics = GUIDE_SECTIONS.find((section) => section.id === 'analytics');
    expect(analytics?.points.join(' ')).toContain('plain-language review');
    expect(analytics?.points.join(' ')).toContain('Ask the coach');
    expect(analytics?.shots.some((shot) => shot.shot === 'analytics-review')).toBe(true);
  });

  it('shows a full snapshot for every surface on every page', () => {
    const shots = GUIDE_SECTIONS.flatMap((section) => section.shots);
    expect(GUIDE_SECTIONS.every((section) => section.shots.length >= 1)).toBe(true);
    expect(shots.map((shot) => shot.shot)).toEqual([
      'home-desk',
      'home-identity',
      'home-share',
      'home-calendar',
      'work-projects',
      'work-research',
      'work-project',
      'connections-list',
      'connections-open',
      'circle-feed',
      'analytics-review',
      'analytics-reach',
      'analytics-projects',
      'analytics-research',
      'analytics-audience',
      'settings-identity',
      'settings-signin',
      'settings-plan',
      'settings-export',
    ]);
  });

  it('is a dedicated page from the landing pill, not an in-page tab', () => {
    const page = read('src/app/(marketing)/guide/page.tsx');
    const view = read('src/components/landing/guide-page.tsx');
    const how = read('src/app/(marketing)/how-it-works/page.tsx');
    expect(existsSync(resolve(WEB, 'src/app/(marketing)/guide/page.tsx'))).toBe(true);
    expect(page).toContain('GuidePage');
    expect(view).toContain('cc-guide-jump');
    expect(view).toContain('cc-guide-jump__thumb');
    expect(view).toContain('jumpToSection');
    expect(view).toContain('EditorialProductFrame');
    expect(view).toContain('GuideLiveShot');
    expect(view).toContain('section.shots');
    expect(view).toContain('fit="content"');
    expect(view).toContain('className="cc-guide-page"');
    expect(view).not.toContain('cc-ed cc-guide-page');
    expect(view).not.toContain('className="cc-ed');
    expect(view).not.toContain("import '@/styles/editorial-landing.css'");
    const frame = read('src/components/landing/editorial/editorial-product-frame.tsx');
    const landingCss = read('src/styles/editorial-landing.css');
    const guideCss = read('src/styles/guide-page.css');
    const chromeTone = read('src/components/landing/editorial/landing-chrome-tone.ts');
    expect(frame).toContain('MutationFeedbackProvider');
    expect(frame).toContain('fit === \'content\'');
    expect(landingCss).toContain('.cc-ed__frame--fit .cc-ed__demo-snap__inner');
    expect(landingCss).toContain(
      '/* Cinema chrome only while the landing hero scene is on the page. */',
    );
    expect(landingCss).toContain(
      '.cc-marketing-shell:has(.cc-ed-hero-scene) .cc-marketing-nav-shell',
    );
    expect(landingCss).not.toContain(
      '.cc-marketing-shell:has(.cc-ed) .cc-marketing-nav-shell',
    );
    expect(chromeTone).toContain(':has(.cc-ed-hero-scene) .cc-nav-veil');
    expect(guideCss).not.toContain('overflow: visible');
    expect(how).toContain('permanentRedirect');
    expect(how).toContain('MARKETING_GUIDE_HREF');
  });
});
