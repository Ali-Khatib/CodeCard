import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GUIDE_CLOSE, GUIDE_SECTIONS, guideCoveredShots } from './guide-content';
import { MARKETING_GUIDE_HREF } from './site-routes';

const WEB = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(WEB, path), 'utf8');

describe('marketing Guide walkthrough', () => {
  it('covers every live-demo sidebar tab as six chapters', () => {
    expect(MARKETING_GUIDE_HREF).toBe('/guide');
    expect(GUIDE_SECTIONS.map((section) => section.nav)).toEqual([
      'Home',
      'Work',
      'Connections',
      'Circle',
      'Analytics',
      'Settings',
    ]);
    expect(GUIDE_SECTIONS.map((section) => section.kicker)).toEqual([
      '01 · Home',
      '02 · Work',
      '03 · Connections',
      '04 · Circle',
      '05 · Analytics',
      '06 · Settings',
    ]);
    expect(GUIDE_SECTIONS.map((section) => section.glanceTitle)).toEqual([
      'Your Card',
      'Your Work',
      'Connections',
      'Circle',
      'Analytics',
      'Settings',
    ]);
    const connections = GUIDE_SECTIONS.find((section) => section.id === 'connections');
    expect(connections?.lead).toContain('scan your QR');
    expect(connections?.lead).toContain('view a CodeCard');
    const work = GUIDE_SECTIONS.find((section) => section.id === 'work');
    expect(work?.canDo.map((item) => `${item.title} ${item.body}`).join(' ')).toContain('slides');
    expect(work?.canDo.map((item) => item.title)).toEqual([
      'Projects',
      'Project pages',
      'Research',
      'Drafts vs published',
    ]);
    const analytics = GUIDE_SECTIONS.find((section) => section.id === 'analytics');
    expect(analytics?.canDo.map((item) => item.title).join(' ')).toContain('Review & Coach');
    expect(analytics?.screens[0]?.shot).toBe('analytics-reach');
    expect(GUIDE_SECTIONS.every((section) => section.canDoHeading === 'What you can do')).toBe(
      true,
    );
    expect(GUIDE_CLOSE.body).toContain('moments that happen offline');
  });

  it('keeps the tour on real demo screens without numbering each feature', () => {
    const covered = guideCoveredShots();
    for (const shot of [
      'home-share',
      'home-identity',
      'work-projects',
      'work-research',
      'connections-list',
      'connections-open',
      'circle-feed',
      'analytics-reach',
      'settings-identity',
    ] as const) {
      expect(covered).toContain(shot);
    }
    const home = read('src/components/dashboard/dashboard-overview-view.tsx');
    expect(home).toContain("guideFocus === 'work'");
    expect(home).toContain("guideFocus === 'reach'");
    expect(home).toContain("guideFocus === 'circle'");
    expect(home).not.toContain('showDesk && showWork');
    const view = read('src/components/landing/guide-page.tsx');
    expect(view).not.toContain('cc-guide-shot__step');
    expect(view).not.toContain('cc-guide-section__points');
    expect(view).not.toContain('Show more of this page');
    expect(view).not.toContain('cc-guide-overview__pin');
    expect(view).not.toContain('GUIDE_STORY');
  });

  it('is a dedicated page from the landing pill, not an in-page tab', () => {
    const page = read('src/app/(marketing)/guide/page.tsx');
    const view = read('src/components/landing/guide-page.tsx');
    const how = read('src/app/(marketing)/how-it-works/page.tsx');
    expect(existsSync(resolve(WEB, 'src/app/(marketing)/guide/page.tsx'))).toBe(true);
    expect(page).toContain('GuidePage');
    expect(view).toContain('cc-guide-jump');
    expect(view).toContain('jumpToSection');
    expect(view).toContain('EditorialProductFrame');
    expect(view).toContain('GuideLiveShot');
    expect(view).toContain('CodeCard at a glance');
    expect(view).toContain('cc-guide-glance');
    expect(view).toContain('cc-guide-chapter');
    expect(view).toContain('section.canDoHeading');
    expect(view).toContain('cc-guide-close');
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
    expect(frame).toContain("shot === 'home-overview'");
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
    expect(guideCss).toContain('.cc-guide-chapter');
    expect(guideCss).not.toContain('overflow: visible');
    expect(how).toContain('permanentRedirect');
    expect(how).toContain('MARKETING_GUIDE_HREF');
  });

  it('treats Connections as a QR scan, not a public-link save', () => {
    const connections = GUIDE_SECTIONS.find((section) => section.id === 'connections');
    expect(connections?.canDo.map((item) => item.title)).toEqual([
      'People you’ve met',
      'Meeting context',
      'Notes',
      'Follow-ups',
      'Their CodeCard',
    ]);
    const homeShare = GUIDE_SECTIONS.find((section) => section.id === 'home')?.canDo.find(
      (item) => item.title === 'Share your card',
    );
    expect(homeShare?.body).toContain('does not create a Connection');
    const circle = GUIDE_SECTIONS.find((section) => section.id === 'circle');
    expect(circle?.lead).toContain('Connections are the people');
    expect(circle?.lead).toContain('Circle is what those people are doing');
    expect(circle?.lead.toLowerCase()).toContain('not social media');
  });
});
