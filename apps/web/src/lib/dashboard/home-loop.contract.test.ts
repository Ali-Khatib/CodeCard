import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('first-user Home loop', () => {
  it('wires authenticated Home through the loop state machine', () => {
    const page = read('src/app/dashboard/(authenticated)/page.tsx');
    expect(page).toContain('getHomeWorkspaceNextStep');
    expect(page).toContain('hasAnyProject={completionResult.hasAnyProject}');
  });

  it('hides competing Home surfaces until the card is public', () => {
    const overview = read('src/components/dashboard/dashboard-overview-view.tsx');
    expect(overview).toContain("loopState === 'complete_identity'");
    expect(overview).toContain("loopState === 'share_card'");
    expect(overview).toContain('showShare');
    expect(overview).toContain('showWork');
    expect(overview).toContain('showLaterSurfaces');
    expect(overview).toContain('Continue building');
  });

  it('returns first-project create into the existing editor, then Home', () => {
    const create = read('src/lib/projects/project-create-core.ts');
    const edit = read('src/app/dashboard/(authenticated)/projects/[id]/edit/page.tsx');
    const neu = read('src/app/dashboard/(authenticated)/projects/new/page.tsx');
    expect(create).toContain('isFirstProject');
    expect(create).toContain('?from=first-project');
    expect(create).toContain('redirectTo: `/dashboard/projects/${projectId}/edit');
    expect(edit).toContain('href="/dashboard"');
    expect(edit).toContain('fromFirstProject');
    expect(neu).toContain('href="/dashboard"');
    expect(neu).toContain('Back to Home');
  });

  it('keeps Create project available in the shell without competing with Home CTAs', () => {
    const shell = read('src/components/dashboard/dashboard-shell.tsx');
    const layout = read('src/app/dashboard/(authenticated)/layout.tsx');
    const demo = read('src/app/demo/(workspace)/layout.tsx');
    expect(layout).toContain('getHomeLoopState');
    expect(layout).toContain('homeLoopState={homeLoopState}');
    expect(demo).toContain('homeLoopState="share_card"');
    expect(shell).toContain('shellCreateProjectEmphasis(homeLoopState)');
    expect(shell).toContain('workspaceCreateProjectHref(basePath)');
    expect(shell).not.toContain('variant="primary"\n            className="cc-app-topbar-cta');
  });
});
