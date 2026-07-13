import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { sortProjectsByEffectiveOrder } from './project-order-core';
import {
  buildPublicProjectDetailHref,
  getAdjacentProjects,
} from './project-navigation';

type FixtureProject = {
  id: string;
  title: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
};

const PROJECT_A: FixtureProject = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  title: 'Published Project A',
  is_published: true,
  sort_order: 0,
  created_at: '2026-01-01T00:00:00.000Z',
};

const PROJECT_B: FixtureProject = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  title: 'Unpublished Project B',
  is_published: false,
  sort_order: 1,
  created_at: '2026-01-02T00:00:00.000Z',
};

const PROJECT_C: FixtureProject = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  title: 'Published Project C',
  is_published: true,
  sort_order: 2,
  created_at: '2026-01-03T00:00:00.000Z',
};

const PROJECT_D: FixtureProject = {
  id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  title: 'Published Project D',
  is_published: true,
  sort_order: 3,
  created_at: '2026-01-04T00:00:00.000Z',
};

const FOREIGN_PROJECT: FixtureProject = {
  id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  title: 'Foreign Profile Project',
  is_published: true,
  sort_order: 0,
  created_at: '2026-01-05T00:00:00.000Z',
};

function publishedNavigationSequence(projects: FixtureProject[]) {
  const orderings = projects.map((project, index) => ({
    project_id: project.id,
    sort_order: index,
  }));

  return sortProjectsByEffectiveOrder(projects, orderings).filter(
    (project) => project.is_published,
  );
}

describe('getAdjacentProjects', () => {
  it('returns no neighbors for a single published project', () => {
    const neighbors = getAdjacentProjects([PROJECT_A], PROJECT_A.id);
    expect(neighbors).toEqual({ previous: null, next: null });
  });

  it('navigates two published projects without wrapping', () => {
    const sequence = publishedNavigationSequence([PROJECT_A, PROJECT_C]);

    expect(getAdjacentProjects(sequence, PROJECT_A.id)).toEqual({
      previous: null,
      next: PROJECT_C,
    });
    expect(getAdjacentProjects(sequence, PROJECT_C.id)).toEqual({
      previous: PROJECT_A,
      next: null,
    });
  });

  it('filters unpublished projects while preserving published relative order', () => {
    const sequence = publishedNavigationSequence([
      PROJECT_A,
      PROJECT_B,
      PROJECT_C,
      PROJECT_D,
    ]);

    expect(sequence.map((project) => project.id)).toEqual([
      PROJECT_A.id,
      PROJECT_C.id,
      PROJECT_D.id,
    ]);

    expect(getAdjacentProjects(sequence, PROJECT_A.id)).toEqual({
      previous: null,
      next: PROJECT_C,
    });
    expect(getAdjacentProjects(sequence, PROJECT_C.id)).toEqual({
      previous: PROJECT_A,
      next: PROJECT_D,
    });
    expect(getAdjacentProjects(sequence, PROJECT_D.id)).toEqual({
      previous: PROJECT_C,
      next: null,
    });
  });

  it('does not wrap the first project to the last project', () => {
    const sequence = publishedNavigationSequence([PROJECT_A, PROJECT_C, PROJECT_D]);
    expect(getAdjacentProjects(sequence, PROJECT_A.id).previous).toBeNull();
  });

  it('does not wrap the last project to the first project', () => {
    const sequence = publishedNavigationSequence([PROJECT_A, PROJECT_C, PROJECT_D]);
    expect(getAdjacentProjects(sequence, PROJECT_D.id).next).toBeNull();
  });

  it('updates neighbors after removing a middle published project', () => {
    const before = publishedNavigationSequence([PROJECT_A, PROJECT_B, PROJECT_C, PROJECT_D]);
    const after = publishedNavigationSequence([PROJECT_A, PROJECT_B, PROJECT_D]);

    expect(getAdjacentProjects(before, PROJECT_A.id).next?.id).toBe(PROJECT_C.id);
    expect(getAdjacentProjects(after, PROJECT_A.id).next?.id).toBe(PROJECT_D.id);
    expect(getAdjacentProjects(after, PROJECT_D.id).previous?.id).toBe(PROJECT_A.id);
  });

  it('excludes foreign profile projects from a profile-scoped sequence', () => {
    const sequence = publishedNavigationSequence([PROJECT_A, PROJECT_C]);
    expect(getAdjacentProjects(sequence, FOREIGN_PROJECT.id)).toEqual({
      previous: null,
      next: null,
    });
  });

  it('builds internal public project URLs with encoded route values', () => {
    expect(buildPublicProjectDetailHref('alex-chen', PROJECT_A.id)).toBe(
      `/alex-chen/projects/${PROJECT_A.id}`,
    );
    expect(buildPublicProjectDetailHref('demo', PROJECT_A.id)).toBe(
      `/demo/projects/${PROJECT_A.id}`,
    );
  });
});

describe('public project detail route contract', () => {
  it('loads published profile-scoped projects in effective order', () => {
    const page = readFileSync(
      resolve(process.cwd(), 'src/app/[slug]/projects/[id]/page.tsx'),
      'utf8',
    );

    expect(page).toContain(".eq('is_public', true)");
    expect(page).toContain(".eq('profile_id', profile.id)");
    expect(page).toContain(".eq('is_published', true)");
    expect(page).toContain('sortProjectsByEffectiveOrder');
    expect(page).toContain('loadProfileProjectOrderings');
    expect(page).toContain('notFound()');
  });

  it('uses non-wrapping adjacent navigation in the detail view', () => {
    const detail = readFileSync(
      resolve(process.cwd(), 'src/components/featured-work/project-detail-view.tsx'),
      'utf8',
    );

    expect(detail).toContain('getAdjacentProjects');
    expect(detail).not.toContain('% projectList.length');
    expect(detail).toContain('buildPublicProjectDetailHref');
    expect(detail).toContain('aria-label={`Previous project:');
    expect(detail).toContain('aria-label={`Next project:');
  });
});

describe('revalidation for public project navigation', () => {
  it('revalidates public profile and project detail routes after reorder', () => {
    const actions = readFileSync(
      resolve(process.cwd(), 'src/lib/projects/project-order-actions.ts'),
      'utf8',
    );

    expect(actions).toContain('revalidatePublicProjectNavigation');
  });
});
