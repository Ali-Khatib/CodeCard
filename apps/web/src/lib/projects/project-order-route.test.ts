import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

describe('project ordering integration', () => {
  it('loads effective ordering on the dashboard projects route', () => {
    const page = read('src/app/dashboard/(authenticated)/projects/page.tsx');
    expect(page).toContain('loadProfileProjectOrderings');
    expect(page).toContain('sortProjectsByEffectiveOrder');
    expect(page).not.toMatch(/from\('projects'\)[\s\S]*\.order\('sort_order'/);
  });

  it('exposes accessible move controls on the dashboard project list', () => {
    const stack = read('src/components/dashboard/projects-vertical-stack.tsx');
    const toolbar = read('src/components/dashboard/project-reorder-toolbar.tsx');
    expect(stack).toContain('ProjectReorderToolbar');
    expect(toolbar).toContain('Move up');
    expect(toolbar).toContain('Move down');
    expect(toolbar).toContain('reorderProjectsAction');
  });

  it('uses effective ordering on public profile and project detail routes', () => {
    const profilePage = read('src/app/[slug]/page.tsx');
    const projectPage = read('src/app/[slug]/projects/[id]/page.tsx');
    expect(profilePage).toContain('sortProjectsByEffectiveOrder');
    expect(projectPage).toContain('sortProjectsByEffectiveOrder');
  });

  it('revalidates dashboard and public profile routes after reorder', () => {
    const actions = read('src/lib/projects/project-order-actions.ts');
    expect(actions).toContain("revalidatePath('/dashboard/projects')");
    expect(actions).toContain('revalidatePath(`/${profileResult.profile.slug}`)');
  });
});
