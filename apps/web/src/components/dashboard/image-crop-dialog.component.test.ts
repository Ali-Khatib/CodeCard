import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('ImageCropDialog component', () => {
  it('exposes an accessible crop dialog with zoom and confirm controls', () => {
    const component = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/image-crop-dialog.tsx'),
      'utf8',
    );

    expect(component).toContain('export function ImageCropDialog');
    expect(component).toContain('react-easy-crop');
    expect(component).toContain('getCroppedImageFile');
    expect(component).toContain('role="dialog"');
    expect(component).toContain('aria-modal="true"');
    expect(component).toContain('data-testid="image-crop-dialog"');
    expect(component).toContain('type="range"');
    expect(component).toContain('Zoom');
    expect(component).toContain('Cancel');
  });
});
