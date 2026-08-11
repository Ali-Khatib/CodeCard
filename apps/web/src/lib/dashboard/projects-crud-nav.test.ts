import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { dbProjectToPortfolioProject } from '@/lib/dashboard/portfolio';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS09-T004 projects CRUD navigation', () => {
  it('maps owner projects to real edit and conditional public routes', () => {
    const draft = dbProjectToPortfolioProject(
      {
        id: 'p-draft',
        title: 'Draft',
        tagline: null,
        is_published: false,
        technologies: [],
      },
      {
        profileSlug: 'alex',
        isProfilePublic: true,
        basePath: '/dashboard',
      },
    );
    expect(draft.editHref).toBe('/dashboard/projects/p-draft/edit');
    expect(draft.publicHref).toBeUndefined();
    expect(draft.previewHref).toBe('/dashboard/projects/p-draft/preview');
    expect(draft.href).toBe('/dashboard/projects/p-draft/preview');
    expect(draft.views).toBeUndefined();
    expect(draft.saves).toBeUndefined();

    const live = dbProjectToPortfolioProject(
      {
        id: 'p-live',
        title: 'Live',
        tagline: null,
        is_published: true,
        technologies: [],
      },
      {
        profileSlug: 'alex',
        isProfilePublic: true,
        basePath: '/dashboard',
      },
    );
    expect(live.editHref).toBe('/dashboard/projects/p-live/edit');
    expect(live.publicHref).toBe('/alex/projects/p-live');
    expect(live.previewHref).toBe('/dashboard/projects/p-live/preview');
    expect(live.href).toBe('/alex/projects/p-live');

    const privateProfile = dbProjectToPortfolioProject(
      {
        id: 'p-hidden',
        title: 'Hidden',
        tagline: null,
        is_published: true,
        technologies: [],
      },
      {
        profileSlug: 'alex',
        isProfilePublic: false,
        basePath: '/dashboard',
      },
    );
    expect(privateProfile.publicHref).toBeUndefined();
    expect(privateProfile.href).toBe('/dashboard/projects/p-hidden/preview');
  });

  it('wires Projects tab create/edit actions to real routes', () => {
    const page = read('src/app/dashboard/(authenticated)/projects/page.tsx');
    const portfolio = read('src/components/dashboard/dashboard-projects-portfolio.tsx');
    const stack = read('src/components/dashboard/projects-vertical-stack.tsx');

    expect(page).toContain('dbProjectToPortfolioProject');
    expect(page).toContain('isProfilePublic');
    expect(page).toContain("basePath: '/dashboard'");
    expect(portfolio).toContain('workspaceCreateProjectHref');
    expect(portfolio).toContain('Create project');
    expect(stack).toContain('editHref');
    expect(stack).toContain('View project');
    expect(stack).toContain('View public');
    expect(stack).not.toContain('Math.random');
  });
});
