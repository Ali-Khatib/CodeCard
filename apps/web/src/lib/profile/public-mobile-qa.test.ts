import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 430, height: 932 },
] as const;

describe('WS06-T007 mobile public page QA contracts', () => {
  it('documents the required mobile viewport matrix', () => {
    expect(VIEWPORTS.map((v) => v.width)).toEqual([375, 390, 412, 430]);
  });

  it('adds break-words / min-width fixes without global document overflow masking', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'src/styles/codecard-app-system.css'),
      'utf8',
    );
    const profile = readFileSync(
      resolve(process.cwd(), 'src/components/profile/public-profile-focused.tsx'),
      'utf8',
    );
    const projects = readFileSync(
      resolve(process.cwd(), 'src/components/profile/public-project-stack.tsx'),
      'utf8',
    );
    const research = readFileSync(
      resolve(process.cwd(), 'src/components/research/research-paper-detail.tsx'),
      'utf8',
    );
    const projectDetail = readFileSync(
      resolve(process.cwd(), 'src/components/featured-work/project-detail-view.tsx'),
      'utf8',
    );
    const notFound = readFileSync(
      resolve(process.cwd(), 'src/components/public/public-not-found-view.tsx'),
      'utf8',
    );

    expect(css).toContain('.cc-public-profile');
    expect(css).toContain('max-width: 100%');
    expect(css).toContain('min-width: 0');
    expect(css).not.toMatch(/html\s*,\s*body[\s\S]{0,80}overflow-x:\s*hidden/);
    expect(css).not.toMatch(/\.cc-public-profile[^{]*\{[^}]*overflow-x:\s*hidden/);

    expect(profile).toContain('break-words');
    expect(profile).toContain('break-all');
    expect(profile).toContain('min-w-0');
    expect(projects).toContain('break-words');
    expect(research).toContain('break-words');
    expect(projectDetail).toContain('break-words');
    expect(projectDetail).toContain('md:hidden');
    expect(notFound).toContain('max-w-[100vw]');
    expect(notFound).toContain('break-words');
  });

  it('keeps long stress content as plain text fields on public surfaces', () => {
    const profile = readFileSync(
      resolve(process.cwd(), 'src/components/profile/public-profile-focused.tsx'),
      'utf8',
    );
    expect(profile).toContain('{displayName}');
    expect(profile).toContain('{intro}');
    expect(profile).not.toContain('dangerouslySetInnerHTML');
  });
});
