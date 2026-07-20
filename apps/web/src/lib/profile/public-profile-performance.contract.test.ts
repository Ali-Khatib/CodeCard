import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../../../../..');
const WEB = path.resolve(__dirname, '../../..');

function readRepo(rel: string) {
  return readFileSync(path.resolve(ROOT, rel), 'utf8');
}

function readWeb(rel: string) {
  return readFileSync(path.resolve(WEB, rel), 'utf8');
}

describe('WS14-T019 public profile performance contract', () => {
  it('documents LCP budget and measurement script', () => {
    const doc = readRepo('docs/PUBLIC_PROFILE_PERFORMANCE.md');
    expect(doc).toMatch(/LCP.*2\.5/i);
    expect(doc).toContain('lighthouse-public-profile.mjs');
    expect(doc).toContain('createPublicClient');
  });

  it('keeps public profile on cookie-free data path with priority LCP image', () => {
    const page = readWeb('src/app/[slug]/page.tsx');
    expect(page).toContain('createPublicClient');
    expect(page).not.toMatch(/await createClient\(\)/);

    const stack = readWeb('src/components/profile/public-project-stack.tsx');
    expect(stack).toContain('priority={index === 0}');
    expect(stack).toContain('eager={index === 0}');

    const focused = readWeb('src/components/profile/public-profile-focused.tsx');
    expect(focused).toContain('priority');
    expect(focused).toContain("from '@/lib/profile/parse-headline'");
  });
});
