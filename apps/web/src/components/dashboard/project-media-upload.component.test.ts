import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('ProjectMediaUpload component', () => {
  it('exposes accessible cover and screenshot controls without replacement or deletion', () => {
    const component = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/project-media-upload.tsx'),
      'utf8',
    );

    expect(component).toContain('export function ProjectMediaUpload');
    expect(component).toContain('Choose project cover image');
    expect(component).toContain('Choose project screenshots');
    expect(component).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(component).toContain('multiple');
    expect(component).toContain('role="status"');
    expect(component).toContain('Replacement will be available');
    expect(component).toContain('finalizeProjectMediaUploadAction');
    expect(component).not.toContain('compress');
    expect(component).not.toMatch(/service.?role/i);
    expect(component).not.toMatch(/\.remove\(/);
  });
});
