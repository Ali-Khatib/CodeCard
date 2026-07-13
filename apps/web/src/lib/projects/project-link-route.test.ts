import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

describe('project links CRUD integration', () => {
  it('renders ProjectLinksEditor on the project edit route', () => {
    const page = read('src/app/dashboard/(authenticated)/projects/[id]/edit/page.tsx');
    expect(page).toContain('ProjectLinksEditor');
    expect(page).toContain('loadOwnedProjectLinksForProject');
  });

  it('uses dedicated project link actions with revalidation', () => {
    const actions = read('src/lib/projects/project-link-actions.ts');
    expect(actions).toContain('createProjectLinkAction');
    expect(actions).toContain('updateProjectLinkAction');
    expect(actions).toContain('deleteProjectLinkAction');
    expect(actions).toContain('revalidateOwnedProjectPaths');
    expect(actions).not.toContain('service_role');
  });

  it('filters unsafe project links on public rendering', () => {
    const stack = read('src/components/profile/public-project-stack.tsx');
    const portfolio = read('src/lib/dashboard/portfolio.ts');
    expect(stack).toContain('firstSafeProjectLink');
    expect(stack).toContain('noopener noreferrer');
    expect(portfolio).toContain('firstSafeProjectLink');
  });

  it('does not add project reorder controls in the links task', () => {
    const editor = read('src/components/dashboard/project-links-editor.tsx');
    expect(editor).not.toContain('reorderProjects');
    expect(editor).not.toContain('Move Up');
  });
});
