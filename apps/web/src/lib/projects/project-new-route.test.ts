import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('dashboard new project route', () => {
  it('renders the authenticated create form route', () => {
    const page = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/projects/new/page.tsx'),
      'utf8',
    );

    expect(page).toContain('ProjectCreateForm');
    expect(page).not.toContain('mock');
    expect(page).not.toContain('redirect(');
  });

  it('uses the secure create action through the shared project form', () => {
    const form = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/project-form.tsx'),
      'utf8',
    );

    expect(form).toContain("from '@/app/actions/projects'");
    expect(form).toContain('createProjectAction');
    expect(form).toContain('project-title');
    expect(form).toContain('project-slug');
    expect(form).toContain('project-tagline');
    expect(form).toContain('project-description');
    expect(form).toContain('project-user-role');
    expect(form).toContain('project-started-at');
    expect(form).toContain('project-ended-at');
    expect(form).toContain('project-status');
    expect(form).toContain('PROJECT_FORM_DOMAIN_OPTIONS');
    expect(form).toContain('PROJECT_FORM_FOCUS_AREA_OPTIONS');
    expect(form).not.toContain('is_published');
    expect(form).not.toContain('case_study');
    expect(form).not.toContain('section_media');
    expect(form).toContain('suggestProjectSlugFromTitle');
    expect(form).toContain('slugEdited');
    expect(form).toContain('/dashboard/projects');
  });

  it('keeps dashboard CTAs pointed at the new project route', () => {
    const shell = readFileSync(resolve(process.cwd(), 'src/components/dashboard/dashboard-shell.tsx'), 'utf8');
    const home = readFileSync(resolve(process.cwd(), 'src/components/dashboard/dashboard-home-view.tsx'), 'utf8');
    const portfolio = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-projects-portfolio.tsx'),
      'utf8',
    );

    expect(shell).toContain('/projects/new');
    expect(home).toContain('/dashboard/projects/new');
    expect(portfolio).toContain('/projects/new');
  });

  it('requires authentication through the dashboard layout', () => {
    const layout = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/layout.tsx'),
      'utf8',
    );

    expect(layout).toContain('getUser');
    expect(layout).toContain('buildSignInHref');
    expect(layout).toContain("eq('owner_user_id', user.id)");
  });
});
