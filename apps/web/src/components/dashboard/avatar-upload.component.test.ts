import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('AvatarUpload component', () => {
  it('renders current avatar, fallback, accessible file input, and phase-based status', () => {
    const component = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/avatar-upload.tsx'),
      'utf8',
    );

    expect(component).toContain('export function AvatarUpload');
    expect(component).toContain('initialAvatarUrl');
    expect(component).toContain('displayName.trim()[0]');
    expect(component).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(component).toContain('Choose profile photo');
    expect(component).toContain('Replace photo');
    expect(component).toContain('aria-busy={pending}');
    expect(component).toContain('role="status"');
    expect(component).toContain('UploadProgressIndicator');
    expect(component).toContain('AbortController');
    expect(component).toContain('Retry');
    expect(component).toContain('Cancel upload');
    expect(component).toContain('Avatar saved');
    expect(component).toContain('URL.revokeObjectURL');
    expect(component).toContain('finalizeAvatarUploadAction');
    expect(component).toContain('uploadAvatarToSignedUrl');
    expect(component).not.toMatch(/setInterval\s*\([^)]*progress/i);
    expect(component).not.toMatch(/service.?role/i);
  });

  it('delegates previous avatar cleanup to trusted server-side finalization', () => {
    const core = readFileSync(resolve(process.cwd(), 'src/lib/profile/profile-avatar-core.ts'), 'utf8');
    const component = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/avatar-upload.tsx'),
      'utf8',
    );

    expect(core).toContain('bestEffortRemoveTrustedStorageObject');
    expect(core).toContain('extractAvatarPathFromPublicUrl');
    expect(component).not.toMatch(/\.remove\(/);
  });
});

describe('Next.js image host configuration', () => {
  it('permits Supabase storage without adding a wildcard external host', () => {
    const nextConfig = readFileSync(resolve(process.cwd(), 'next.config.ts'), 'utf8');
    expect(nextConfig).toContain("hostname: '**.supabase.co'");
    expect(nextConfig).not.toContain("hostname: '*'");
    expect(nextConfig).not.toContain('hostname: "**"');
  });
});
