import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('FadeInView', () => {
  it('caches motion.create per element tag so wrapped inputs keep focus on re-render', () => {
    const src = read('src/components/dashboard/fade-in-view.tsx');
    expect(src).toContain('motionForTag');
    expect(src).not.toMatch(/^\s*const MotionTag = motion\.create\(Tag\);/m);
  });
});
