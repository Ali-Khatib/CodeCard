import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('project publishing controls', () => {
  it('exposes owner-only publish actions on the edit page', () => {
    const page = readFileSync(
      resolve(
        process.cwd(),
        'src/app/dashboard/(authenticated)/projects/[id]/edit/page.tsx',
      ),
      'utf8',
    );
    const controls = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/project-publish-controls.tsx'),
      'utf8',
    );
    const action = readFileSync(resolve(process.cwd(), 'src/app/actions/projects.ts'), 'utf8');

    expect(page).toContain('ProjectPublishControls');
    expect(controls).toContain('publishProjectAction');
    expect(controls).toContain('unpublishProjectAction');
    expect(controls).toContain('Unpublishing removes this project');
    expect(action).toContain('executePublishProject');
  });

  it('keeps public project queries filtered to published projects', () => {
    const publicPage = readFileSync(
      resolve(process.cwd(), 'src/app/[slug]/projects/[id]/page.tsx'),
      'utf8',
    );
    const profilePage = readFileSync(resolve(process.cwd(), 'src/app/[slug]/page.tsx'), 'utf8');

    expect(publicPage).toContain(".eq('is_published', true)");
    expect(profilePage).toContain('is_published');
  });
});
