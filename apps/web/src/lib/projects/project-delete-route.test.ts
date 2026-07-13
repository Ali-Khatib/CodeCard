import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('project delete flow', () => {
  it('requires confirmation before deleting on the edit page', () => {
    const dialog = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/project-delete-dialog.tsx'),
      'utf8',
    );
    const page = readFileSync(
      resolve(
        process.cwd(),
        'src/app/dashboard/(authenticated)/projects/[id]/edit/page.tsx',
      ),
      'utf8',
    );

    expect(page).toContain('ProjectDeleteDialog');
    expect(dialog).toContain('Delete project');
    expect(dialog).toContain('Confirm delete');
    expect(dialog).toContain('Cancel');
    expect(dialog).toContain('cannot be undone');
    expect(dialog).toContain('deleteProjectAction');
    expect(dialog).not.toContain('service-role');
  });

  it('does not expose delete controls on public pages', () => {
    const publicPage = readFileSync(
      resolve(process.cwd(), 'src/app/[slug]/projects/[id]/page.tsx'),
      'utf8',
    );
    expect(publicPage).not.toContain('Delete');
  });
});
