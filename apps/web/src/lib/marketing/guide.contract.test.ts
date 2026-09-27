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
    expect(how).toContain('permanentRedirect');
    expect(how).toContain('MARKETING_GUIDE_HREF');
  });
});
