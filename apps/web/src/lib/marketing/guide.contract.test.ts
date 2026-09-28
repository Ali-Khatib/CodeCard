import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GUIDE_SECTIONS, GUIDE_STORY, guideCoveredShots } from './guide-content';
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
      'scan your QR',
    );
    const work = GUIDE_SECTIONS.find((section) => section.id === 'work');
    expect(work?.canDo.map((item) => `${item.title} ${item.body}`).join(' ')).toContain('slides');
    const analytics = GUIDE_SECTIONS.find((section) => section.id === 'analytics');
    expect(analytics?.canDo.map((item) => `${item.title} ${item.body}`).join(' ')).toContain(
      'Ask the coach',
    );
    expect(analytics?.overviewShot).toBe('analytics-review');
    expect(GUIDE_SECTIONS.every((section) => section.canDo.length >= 3)).toBe(true);
    expect(GUIDE_STORY.close).toContain('quick introduction');
  });

  it('keeps every surface discoverable without dumping them as one list', () => {
    const covered = guideCoveredShots();
    for (const shot of [
      'home-desk',
      'home-share',
      'home-identity',
      'home-calendar',
      'home-work',
      'home-reach',
      'home-circle',
      'work-projects',
      'work-project',
      'work-research',
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
    ] as const) {
      expect(covered).toContain(shot);
    }
    expect(GUIDE_SECTIONS.map((section) => section.kicker)).toEqual([
      '01 · Home',
      '02 · Work',
      '03 · Connections',
      '04 · Circle',
      '05 · Analytics',
      '06 · Settings',
    ]);
    const home = read('src/components/dashboard/dashboard-overview-view.tsx');
    expect(home).toContain("guideFocus === 'work'");
    expect(home).toContain("guideFocus === 'reach'");
    expect(home).toContain("guideFocus === 'circle'");
    expect(home).not.toContain('showDesk && showWork');
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
    expect(view).toContain('cc-guide-glance');
    expect(view).toContain('What you can do here');
    expect(view).toContain('cc-guide-overview');
    expect(view).toContain('Show more of this page');
    expect(view).toContain('cc-guide-story');
    expect(view).toContain('section.workflow');
    expect(view).not.toContain('cc-guide-shot__step');
    expect(view).not.toContain('cc-guide-section__points');
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

  it('treats Connections as a scan-to-follow-up walkthrough', () => {
    const connections = GUIDE_SECTIONS.find((section) => section.id === 'connections');
    expect(connections?.workflow?.title).toBe('Meet someone');
    expect(connections?.workflow?.steps.map((step) => step.title)).toEqual([
      'Show your QR',
      'They scan it',
      'They appear here',
      'Add context',
      'Plan the follow-up',
    ]);
    expect(connections?.workflow?.steps.some((step) => step.shot === 'home-share')).toBe(true);
    expect(connections?.workflow?.result).toContain('where you met');
  });
});
