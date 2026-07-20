import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS08-T002 public link click wiring', () => {
  it('tracks profile and project external links without replacing anchors', () => {
    const profile = read('src/components/profile/public-profile-focused.tsx');
    const social = read('src/components/profile/public-profile-social-links.tsx');
    const stack = read('src/components/profile/public-project-stack.tsx');
    const route = read('src/app/api/analytics/route.ts');
    const helper = read('src/lib/analytics/link-click.ts');

    expect(social).toContain('trackLinkClick');
    expect(social).toContain("kind: 'profile'");
    expect(social).toContain('href={link.url}');
    expect(social).toContain('rel="noopener noreferrer"');
    expect(social).not.toContain('preventDefault');
    expect(profile).toContain('profileId={profileId}');
    expect(profile).toContain('<PublicProjectStack');

    expect(stack).toContain('trackLinkClick');
    expect(stack).toContain("kind: 'project'");
    expect(stack).toContain('profileId?: string');
    expect(stack).toContain('href={liveUrl}');
    expect(stack).toContain('href={repoUrl}');
    expect(stack).toContain('rel="noopener noreferrer"');
    expect(stack).not.toContain('preventDefault');
    expect(stack).not.toContain('window.location');

    expect(route).toContain("event_type === 'link_click'");
    expect(route).toContain('isApprovedLinkCategory');
    expect(route).toContain("eq('is_published', true)");
    expect(route).toContain("eq('is_public', true)");

    expect(helper).toContain("event_type: 'link_click'");
    expect(helper).not.toContain('url:');
    expect(helper).toContain('Never blocks navigation');
  });

  it('route handler never imports link_click helpers through the client module (WS14-T008)', () => {
    // Importing via the 'use client' module hands the server route
    // client-reference proxies; invoking one throws and every real
    // link_click returns 500 (found by WS14-T008 real integration testing).
    const route = read('src/app/api/analytics/route.ts');
    const shared = read('src/lib/analytics/link-click.shared.ts');

    expect(route).toContain("from '@/lib/analytics/link-click.shared'");
    expect(route).not.toContain("from '@/lib/analytics/link-click'");
    // The directive only counts at the top of the file (comments may mention it).
    expect(shared).not.toMatch(/^\s*['"]use client['"]/);
    expect(shared).toContain('export function isApprovedLinkCategory');
  });

  it('does not treat internal open-project toggles as link_click', () => {
    const stack = read('src/components/profile/public-project-stack.tsx');
    expect(stack).toContain("setOpenId(isOpen ? null : project.id)");
    expect(stack).not.toMatch(/setOpenId[\s\S]{0,120}trackLinkClick/);
    expect(stack).toContain('trackLinkClick');
  });
});
