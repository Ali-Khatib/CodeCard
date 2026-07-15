import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('WS06-T002 public not-found states', () => {
  it('provides a friendly shared not-found view with safe navigation', () => {
    const view = readFileSync(
      resolve(process.cwd(), 'src/components/public/public-not-found-view.tsx'),
      'utf8',
    );
    const root = readFileSync(resolve(process.cwd(), 'src/app/not-found.tsx'), 'utf8');
    const slug = readFileSync(resolve(process.cwd(), 'src/app/[slug]/not-found.tsx'), 'utf8');

    expect(view).toContain('Page not found');
    expect(view).toContain('Back to CodeCard');
    expect(view).toContain('href="/"');
    expect(view).not.toContain('private');
    expect(view).not.toContain('unpublished');
    expect(view).not.toContain('params.slug');
    expect(root).toContain('PublicNotFoundView');
    expect(slug).toContain('PublicNotFoundView');
  });

  it('keeps equivalent notFound() wiring on public routes without private messaging', () => {
    const profile = readFileSync(resolve(process.cwd(), 'src/app/[slug]/page.tsx'), 'utf8');
    const project = readFileSync(
      resolve(process.cwd(), 'src/app/[slug]/projects/[id]/page.tsx'),
      'utf8',
    );
    const research = readFileSync(
      resolve(process.cwd(), 'src/app/[slug]/research/[paperSlug]/page.tsx'),
      'utf8',
    );

    expect(profile).toContain('notFound()');
    expect(project).toContain('notFound()');
    expect(research).toContain('notFound()');
    expect(profile).not.toContain('This profile is private');
    expect(project).not.toContain('This project is private');
    expect(research).not.toContain('This paper is private');
  });

  it('does not reveal private profile titles in missing metadata', () => {
    const metadata = readFileSync(
      resolve(process.cwd(), 'src/lib/profile/public-metadata.ts'),
      'utf8',
    );
    expect(metadata).toContain("'Profile not found'");
    expect(metadata).toContain('robots: { index: false, follow: false }');
    expect(metadata).toContain('buildUnavailablePublicMetadata');
  });
});

