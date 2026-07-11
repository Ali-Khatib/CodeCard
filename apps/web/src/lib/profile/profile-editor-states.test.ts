import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('profile editor route states', () => {
  it('renders a dashboard profile loading skeleton', () => {
    const loading = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/profile/loading.tsx'),
      'utf8',
    );
    const skeletons = readFileSync(
      resolve(process.cwd(), 'src/components/loading/route-skeletons.tsx'),
      'utf8',
    );

    expect(loading).toContain('DashboardProfileEditorSkeleton');
    expect(skeletons).toContain('aria-label="Loading profile editor"');
    expect(skeletons).toContain('aria-hidden');
  });

  it('shows safe missing and retry states instead of raw errors', () => {
    const page = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/profile/page.tsx'),
      'utf8',
    );
    const states = readFileSync(
      resolve(process.cwd(), 'src/components/profile/profile-editor-route-states.tsx'),
      'utf8',
    );

    expect(page).toContain('ProfileEditorMissingState');
    expect(page).toContain('ProfileEditorLoadErrorState');
    expect(page).not.toContain('notFound()');
    expect(states).not.toMatch(/supabase|postgres|sql/i);
    expect(states).toContain('Try again');
  });

  it('exposes pending, success, and accessible feedback in the editor', () => {
    const editor = readFileSync(resolve(process.cwd(), 'src/components/profile-editor.tsx'), 'utf8');
    const links = readFileSync(
      resolve(process.cwd(), 'src/components/profile/profile-links-editor.tsx'),
      'utf8',
    );
    const publish = readFileSync(
      resolve(process.cwd(), 'src/components/profile/profile-publish-controls.tsx'),
      'utf8',
    );

    expect(editor).toContain('aria-busy={pending}');
    expect(editor).toContain('role="status"');
    expect(links).toContain('aria-busy={busy}');
    expect(links).toContain('role="status"');
    expect(publish).toContain('aria-busy={pending}');
  });

  it('provides a recoverable route error boundary', () => {
    const errorPage = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/profile/error.tsx'),
      'utf8',
    );

    expect(errorPage).toContain('ProfileEditorLoadErrorState');
    expect(errorPage).toContain('reset');
  });
});
