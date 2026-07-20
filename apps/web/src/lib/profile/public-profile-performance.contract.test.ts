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
  });

  it('prioritizes above-fold LCP image and avoids opacity gates on hero', () => {
    const stack = readWeb('src/components/profile/public-project-stack.tsx');
    expect(stack).toContain('loading="lazy"');
    expect(stack).not.toContain('priority={index === 0}');
    expect(stack).not.toContain('motion/react');
    expect(stack).not.toContain('AppReveal');

    const focused = readWeb('src/components/profile/public-profile-focused.tsx');
    expect(focused).toContain('priority');
    expect(focused).toContain("from '@/lib/profile/parse-headline'");
    expect(focused).toContain('cc-app-profile-preview--hero');
    // Server Component shell — no client directive on the LCP bio path.
    expect(focused).not.toMatch(/^['"]use client['"]/m);
  });

  it('keeps public profile route cookie-free for ISR', () => {
    const page = readWeb('src/app/[slug]/page.tsx');
    expect(page).toContain('createPublicClient');
    expect(page).toContain('unstable_cache');
    expect(page).toContain('publicProfileCacheTag');
    expect(page).toContain("dynamic = 'force-static'");
    expect(page).toContain('generateStaticParams');
    expect(page).toContain('dynamicParams = true');
    expect(page).not.toMatch(/\bcookies\s*\(/);
    expect(page).toContain('connectionControl={null}');
  });

  it('invalidates public profile data tags on mutation', () => {
    const cache = readWeb('src/lib/profile/public-cache.ts');
    expect(cache).toContain('revalidateTag');
    expect(cache).toContain('publicProfileCacheTag');
  });
});
