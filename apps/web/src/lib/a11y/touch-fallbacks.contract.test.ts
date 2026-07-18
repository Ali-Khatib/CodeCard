import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const WEB = resolve(process.cwd());

function read(rel: string) {
  return readFileSync(resolve(WEB, 'src', rel), 'utf8');
}

describe('WS12-T008 touch interaction fallbacks', () => {
  it('case-study tabs expose tab semantics and click/keyboard activation', () => {
    const source = read('components/featured-work/project-case-study-tabs.tsx');
    expect(source).toContain('role="tablist"');
    expect(source).toContain('role="tab"');
    expect(source).toContain('role="tabpanel"');
    expect(source).toContain('aria-selected={active}');
    expect(source).toContain('onClick={() => setActive(id, label)}');
    expect(source).toContain('onFocus={() => setActive(id, label)}');
    expect(source).toContain('ArrowRight');
    expect(source).toContain("(hover: hover) and (pointer: fine)");
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
