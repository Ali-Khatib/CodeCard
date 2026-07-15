import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('ProjectMediaUpload component', () => {
  it('exposes accessible cover replacement and screenshot deletion controls', () => {
    const component = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/project-media-upload.tsx'),
      'utf8',
    );

    expect(component).toContain('export function ProjectMediaUpload');
    expect(component).toContain('Choose project cover image');
    expect(component).toContain('Replace cover');
    expect(component).toContain('Upload replacement');
    expect(component).toContain('Choose project screenshots');
    expect(component).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(component).toContain('multiple');
    expect(component).toContain('role="status"');
    expect(component).toContain('deleteProjectScreenshotAction');
    expect(component).toContain('Confirm delete');
    expect(component).toContain('finalizeProjectMediaUploadAction');
    expect(component).toContain('UploadProgressIndicator');
    expect(component).toContain('AbortController');
    expect(component).toContain('Retry upload for');
    expect(component).toContain('progressPercent');
    expect(component).not.toMatch(/setInterval\s*\([^)]*progress/i);
    expect(component).not.toContain('compress');
    expect(component).not.toMatch(/service.?role/i);
  });
});

describe('UploadProgressIndicator', () => {
  it('exposes progressbar semantics without timer-driven percentages', () => {
    const indicator = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/upload-progress-indicator.tsx'),
      'utf8',
    );
    expect(indicator).toContain('role="progressbar"');
    expect(indicator).toContain('aria-valuemin');
    expect(indicator).toContain('aria-valuemax');
    expect(indicator).toContain('Never invents percentages with timers');
    expect(indicator).not.toMatch(/setInterval/);
  });
});
