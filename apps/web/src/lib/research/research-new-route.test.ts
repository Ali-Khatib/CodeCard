import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('dashboard new research route', () => {
  it('renders the authenticated create form route', () => {
    const page = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/research/new/page.tsx'),
      'utf8',
    );

    expect(page).toContain('ResearchCreateForm');
    expect(page).toContain('getUser');
    expect(page).toContain("eq('owner_user_id', user.id)");
    expect(page).toContain("redirect('/sign-in?next=/dashboard/research/new')");
    expect(page).not.toContain('mock');
    expect(page).not.toContain('searchParams');
  });

  it('uses the secure create action through the shared research form', () => {
    const form = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/research-form.tsx'),
      'utf8',
    );

    expect(form).toContain("from '@/app/actions/research'");
    expect(form).toContain('createResearchAction');
    expect(form).toContain('updateResearchAction');
    expect(form).toContain("mode === 'edit'");
    expect(form).toContain('suggestResearchSlugFromTitle');
    expect(form).toContain('slugEdited');
    expect(form).toContain('Add author');
    expect(form).toContain('Title');
    expect(form).toContain('URL slug');
    expect(form).toContain('Abstract');
    expect(form).toContain('Authors');
    expect(form).toContain('Venue');
    expect(form).toContain('Year');
    expect(form).toContain('DOI');
    expect(form).toContain('External paper URL');
    expect(form).toContain('Citation text');
    expect(form).not.toContain('is_published');
    expect(form).toContain('Private PDF uploads stay disabled');
    expect(form).not.toContain('sort_order');
    expect(form).toContain('related-project');
    expect(form).toContain('No related project');
    expect(form).not.toContain('type="file"');
    expect(form).not.toContain('createSignedUpload');
    expect(form).not.toContain('ResearchFigure');
    expect(form).not.toMatch(/\bUnpublish\b/);
    expect(form).not.toMatch(/>\s*Publish\s*</);
  });

  it('loads owned projects for the related-project picker', () => {
    const page = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/research/new/page.tsx'),
      'utf8',
    );
    expect(page).toContain('loadOwnedProjectsForResearchPicker');
    expect(page).toContain('relatedProjectOptions');
  });

  it('keeps dashboard research CTAs pointed at the new research route', () => {
    const view = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-research-view.tsx'),
      'utf8',
    );

    expect(view).toContain('/dashboard/research/new');
    expect(view).toContain('Add research');
    expect(view).toContain('Create paper');
    expect(view).not.toContain('Add from projects');
    expect(view).not.toContain('href="/dashboard/projects"');
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
