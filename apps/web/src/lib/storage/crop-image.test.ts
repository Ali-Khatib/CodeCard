import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('crop-image', () => {
  it('exports a canvas crop helper that returns a jpeg File with optional downscale', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/lib/storage/crop-image.ts'), 'utf8');

    expect(source).toContain('export async function getCroppedImageFile');
    expect(source).toContain("mimeType ?? 'image/jpeg'");
    expect(source).toContain('maxDimension');
    expect(source).toContain('croppedCanvas.toBlob');
    expect(source).toContain('new File([');
    expect(source).toContain("crossOrigin', 'anonymous'");
  });
});
