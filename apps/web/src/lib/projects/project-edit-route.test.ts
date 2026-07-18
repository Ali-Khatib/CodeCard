import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  formatProjectDateForInput,
  projectRecordToFormValues,
} from './project-form';
import { PROJECT_DOMAIN_OPTIONS, PROJECT_FOCUS_AREA_OPTIONS } from '@codecard/validation';

describe('projectRecordToFormValues', () => {
  it('maps saved project fields without timezone shifting dates', () => {
    const values = projectRecordToFormValues(
      {
        title: 'DevFlow',
        slug: 'dev-flow',
        tagline: 'Ship faster',
        description: 'Workflow tooling',
        technologies: ['TypeScript'],
        user_role: 'Lead',
        started_at: '2024-01-15',
        ended_at: '2024-06-01T00:00:00.000Z',
        status: 'active',
      },
      {
        domains: [PROJECT_DOMAIN_OPTIONS[0]],
        focus_areas: [PROJECT_FOCUS_AREA_OPTIONS[0]],
      },
    );

    expect(values.started_at).toBe('2024-01-15');
    expect(values.ended_at).toBe('2024-06-01');
    expect(values.domains).toEqual([PROJECT_DOMAIN_OPTIONS[0]]);
  });

  it('formats empty dates safely', () => {
    expect(formatProjectDateForInput(null)).toBe('');
  });
});

describe('dashboard project edit route', () => {
  it('loads owned projects server-side for the edit page', () => {
    const page = readFileSync(
      resolve(
        process.cwd(),
        'src/app/dashboard/(authenticated)/projects/[id]/edit/page.tsx',
      ),
      'utf8',
    );

    expect(page).toContain('loadOwnedProjectWithRelations');
    expect(page).toContain("mode=\"edit\"");
    expect(page).toContain('notFound()');
    expect(page).toContain('ProjectForm');
  });

  it('reuses the shared project form for editing', () => {
    const form = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/project-form.tsx'),
      'utf8',
    );

    expect(form).toContain('updateProjectAction');
    expect(form).toContain('buildUpdateProjectFormData');
    expect(form).toContain("mode === 'edit'");
    expect(form).not.toContain('ProjectCreateForm');
  });

  it('points dashboard edit controls at the edit route', () => {
    // Since the card-to-page transition work, the stack navigates via the
    // editHref built in lib/dashboard/portfolio.ts.
    const stack = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/projects-vertical-stack.tsx'),
      'utf8',
    );
    const portfolio = readFileSync(
      resolve(process.cwd(), 'src/lib/dashboard/portfolio.ts'),
      'utf8',
    );
    const hero = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/project-hero-card.tsx'),
      'utf8',
    );

    expect(stack).toContain('project.editHref');
    expect(portfolio).toContain('/projects/${project.id}/edit');
    expect(hero).toContain('/projects/${project.id}/edit');
  });

  it('does not expose edit controls on public project pages', () => {
    const publicPage = readFileSync(
      resolve(process.cwd(), 'src/app/[slug]/projects/[id]/page.tsx'),
      'utf8',
    );
    const detail = readFileSync(
      resolve(process.cwd(), 'src/components/featured-work/project-detail-view.tsx'),
      'utf8',
    );

    expect(publicPage).not.toContain('/edit');
    expect(detail).not.toContain('/dashboard/projects');
  });
});
