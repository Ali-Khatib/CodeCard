import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const WEB = resolve(process.cwd());

function read(rel: string) {
  return readFileSync(resolve(WEB, 'src', rel), 'utf8');
}

describe('WS12-T008 touch interaction fallbacks', () => {
  it('case-study tabs expose tab semantics and click/keyboard activation', () => {
    const tabs = read('components/featured-work/project-case-study-tabs.tsx');
    const carousel = read('components/ui/animated-feature-carousel.tsx');
    expect(tabs).toContain('FeatureCarousel');
    expect(carousel).toContain('role="tablist"');
    expect(carousel).toContain('role="tab"');
    expect(carousel).toContain('role="tabpanel"');
    expect(carousel).toContain('aria-selected={isCurrent}');
    expect(carousel).toContain('onClick={() => onChange(stepIdx)}');
    expect(carousel).toContain('onFocus={() => onChange(stepIdx)}');
    expect(carousel).toContain('ArrowRight');
    expect(carousel).toContain('min-h-11');
    expect(carousel).toContain('progressEnabled');
    expect(carousel).toContain("animate={{ width: '100%' }}");
  });

  it('image accordion activates by click and focus, not hover-only', () => {
    const source = read('components/ui/interactive-image-accordion.tsx');
    expect(source).toContain('onClick={onActivate}');
    expect(source).toContain('onFocus={onActivate}');
    expect(source).toContain('role="tab"');
    expect(source).toContain("(hover: hover) and (pointer: fine)");
  });

  it('project card overlays remain available without hover', () => {
    const rich = read('components/dashboard/project-card-rich.tsx');
    expect(rich).toContain('group-focus-within:opacity-100');
    expect(rich).toContain('[@media(hover:none)]:opacity-100');
  });

  it('manage cards preview video on focus as well as hover', () => {
    const card = read('components/dashboard/dashboard-project-manage-card.tsx');
    expect(card).toContain('onFocus={() => setHovered(true)}');
    expect(card).toContain('onBlur=');
  });
});
