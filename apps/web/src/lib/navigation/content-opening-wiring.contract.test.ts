import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('content opening wiring', () => {
  it('keeps MVP sidebar without My Profile', () => {
    const shell = read('src/components/dashboard/dashboard-shell.tsx');
    const navMatch = shell.match(/const NAV_ITEMS = \[([\s\S]*?)\] as const/);
    expect(navMatch).toBeTruthy();
    expect(navMatch![1]).not.toMatch(/My profile|My Profile|segment: 'profile'/);
  });

  it('wires the shared opening transition into project and research entry points', () => {
    const helpers = read('src/lib/navigation/content-opening.ts');
    expect(helpers).toContain("'Opening project'");
    expect(helpers).toContain("'Opening research'");

    const transition = read('src/components/navigation/content-opening-transition.tsx');
    const overlay = read('src/components/navigation/content-opening-overlay.tsx');
    expect(overlay).toContain('aria-live="polite"');
    expect(transition).toContain('useReducedMotion');
    expect(transition).toContain('CONTENT_OPENING_FAILSAFE_MS');
    expect(transition).toContain('shouldInterceptContentOpeningClick');
    expect(transition).toContain("import('./content-opening-overlay')");

    expect(read('src/components/research/research-paper-card.tsx')).toContain('ContentOpeningLink');
    expect(read('src/components/dashboard/projects-bubble-grid.tsx')).toContain('ContentOpeningLink');
    expect(read('src/components/dashboard/research-bubble-grid.tsx')).toContain('ContentOpeningLink');
    expect(read('src/components/dashboard/projects-vertical-stack.tsx')).toContain(
      'navigateWithOpening',
    );
    expect(read('src/app/dashboard/layout.tsx')).toContain('ContentOpeningProvider');
    expect(read('src/app/[slug]/layout.tsx')).toContain('ContentOpeningProvider');
  });

  it('does not wrap external repo/live actions with the opening transition', () => {
    const manage = read('src/components/dashboard/dashboard-project-manage-card.tsx');
    expect(manage).toContain('project.liveUrl');
    expect(manage).toContain('project.repoUrl');
    expect(manage).toMatch(/target="_blank"[\s\S]*Live demo/);
    expect(manage).toMatch(/target="_blank"[\s\S]*GitHub/);
    expect(manage).toContain('<Link href={editLink}>');
  });

  it('uses a static indicator path for reduced motion CSS', () => {
    const css = read('src/styles/codecard-app-system.css');
    expect(css).toContain('.cc-content-opening');
    expect(css).toContain('.cc-content-opening__spinner');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('.cc-content-opening__spinner');
  });
});
