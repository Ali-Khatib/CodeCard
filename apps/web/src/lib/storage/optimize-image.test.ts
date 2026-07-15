import { describe, expect, it, vi, afterEach } from 'vitest';
import { IMAGE_UPLOAD_OPTIMIZATION } from '@codecard/config';
import {
  buildOptimizedImageFilename,
  calculateFitDimensions,
  formatOptimizationSavings,
  optimizeImageForUpload,
  shouldAttemptImageOptimization,
} from './optimize-image';

function makeFile(name: string, type: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('calculateFitDimensions', () => {
  it('scales landscape 4000×3000 into 2000×1500', () => {
    expect(calculateFitDimensions(4000, 3000, 2000, 2000)).toEqual({
      width: 2000,
      height: 1500,
    });
  });

  it('scales portrait 3000×4000 into 1500×2000', () => {
    expect(calculateFitDimensions(3000, 4000, 2000, 2000)).toEqual({
      width: 1500,
      height: 2000,
    });
  });

  it('scales 1200×3000 into 800×2000', () => {
    expect(calculateFitDimensions(1200, 3000, 2000, 2000)).toEqual({
      width: 800,
      height: 2000,
    });
  });

  it('scales 3000×1200 into 2000×800', () => {
    expect(calculateFitDimensions(3000, 1200, 2000, 2000)).toEqual({
      width: 2000,
      height: 800,
    });
  });

  it('leaves images within the cap unchanged', () => {
    expect(calculateFitDimensions(2000, 2000, 2000, 2000)).toEqual({
      width: 2000,
      height: 2000,
    });
    expect(calculateFitDimensions(1000, 800, 2000, 2000)).toEqual({
      width: 1000,
      height: 800,
    });
  });

  it('scales large squares and never returns zero or upscales', () => {
    expect(calculateFitDimensions(4000, 4000, 2000, 2000)).toEqual({
      width: 2000,
      height: 2000,
    });
    const small = calculateFitDimensions(100, 80, 2000, 2000);
    expect(small).toEqual({ width: 100, height: 80 });
  });

  it('rejects invalid dimensions', () => {
    expect(calculateFitDimensions(0, 100, 2000, 2000)).toEqual({
      error: 'Invalid image dimensions.',
    });
    expect(calculateFitDimensions(-4, 100, 2000, 2000)).toEqual({
      error: 'Invalid image dimensions.',
    });
  });

  it('preserves aspect ratio within rounding tolerance', () => {
    const result = calculateFitDimensions(4000, 3000, 2000, 2000);
    expect('width' in result).toBe(true);
    if ('width' in result) {
      const originalRatio = 4000 / 3000;
      const outputRatio = result.width / result.height;
      expect(Math.abs(originalRatio - outputRatio)).toBeLessThan(0.01);
    }
  });
});

describe('shouldAttemptImageOptimization', () => {
  it('uses centralized IMAGE_UPLOAD_OPTIMIZATION caps', () => {
    expect(IMAGE_UPLOAD_OPTIMIZATION.maxWidth).toBe(2000);
    expect(IMAGE_UPLOAD_OPTIMIZATION.maxHeight).toBe(2000);
    expect(shouldAttemptImageOptimization(1999, 1999)).toBe(false);
    expect(shouldAttemptImageOptimization(2001, 100)).toBe(true);
  });
});

describe('filename and savings helpers', () => {
  it('builds MIME-consistent optimized filenames', () => {
    expect(buildOptimizedImageFilename('photo.JPG', 'image/jpeg')).toBe('photo-optimized.jpg');
    expect(buildOptimizedImageFilename('shot.png', 'image/png')).toBe('shot-optimized.png');
    expect(buildOptimizedImageFilename('../evil.webp', 'image/webp')).toBe('evil-optimized.webp');
  });

  it('formats savings only for real shrinks', () => {
    expect(formatOptimizationSavings(6_800_000, 1_900_000)).toContain('Optimized from');
    expect(formatOptimizationSavings(1000, 2000)).toBeNull();
  });
});

describe('optimizeImageForUpload', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('skips unsupported MIME without inventing acceptance', async () => {
    const file = makeFile('doc.pdf', 'application/pdf', 2048);
    const result = await optimizeImageForUpload(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.transformed).toBe(false);
      expect(result.file).toBe(file);
      expect(result.skippedReason).toBe('unsupported_mime');
    }
  });

  it('rejects zero-byte input', async () => {
    const result = await optimizeImageForUpload(makeFile('empty.png', 'image/png', 0));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.canUseOriginal).toBe(false);
    }
  });

  it('returns original when decode fails and keeps can-upload fallback', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        throw new Error('decode failed');
      }),
    );
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = '';
        naturalWidth = 0;
        naturalHeight = 0;
        width = 0;
        height = 0;
        set srcSetter(_value: string) {
          queueMicrotask(() => this.onerror?.());
        }
      },
    );

    // Simple Image stub that errors
    class FailingImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = 0;
      naturalHeight = 0;
      width = 0;
      height = 0;
      set src(_value: string) {
        queueMicrotask(() => this.onerror?.());
      }
    }
    vi.stubGlobal('Image', FailingImage);
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:mock',
      revokeObjectURL: vi.fn(),
    });

    const file = makeFile('broken.png', 'image/png', 2048);
    const result = await optimizeImageForUpload(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.file).toBe(file);
      expect(result.transformed).toBe(false);
      expect(result.skippedReason).toBe('decode_failed_fallback');
    }
  });

  it('uses original when already within dimension caps', async () => {
    const close = vi.fn();
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({
        width: 1200,
        height: 800,
        close,
      })),
    );

    // drawImage path uses bitmap via decodeImageSource draw — createImageBitmap success path
    // needs drawImage; our DecodedBitmap wraps it. Spy document only if resize attempted.

    const file = makeFile('small.png', 'image/png', 4096);
    const result = await optimizeImageForUpload(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.transformed).toBe(false);
      expect(result.skippedReason).toBe('within_limits');
      expect(result.file).toBe(file);
      expect(result.originalWidth).toBe(1200);
      expect(result.originalHeight).toBe(800);
    }
    expect(close).toHaveBeenCalled();
  });

  it('resizes oversized images and prefers smaller output', async () => {
    const close = vi.fn();
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({
        width: 4000,
        height: 3000,
        close,
      })),
    );

    const canvasDraw = vi.fn();
    const toBlob = vi.fn((cb: (blob: Blob | null) => void, type: string) => {
      const bytes = new Uint8Array(500);
      cb(new Blob([bytes], { type }));
    });

    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        width: 0,
        height: 0,
        getContext: () => ({
          fillStyle: '',
          fillRect: vi.fn(),
          drawImage: canvasDraw,
        }),
        toBlob,
      })),
    });

    const file = makeFile('huge.jpg', 'image/jpeg', 4000);
    const result = await optimizeImageForUpload(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.transformed).toBe(true);
      expect(result.outputWidth).toBe(2000);
      expect(result.outputHeight).toBe(1500);
      expect(result.file.size).toBe(500);
      expect(result.file.type).toBe('image/jpeg');
      expect(result.file.name).toContain('-optimized.jpg');
      expect(result.mimeType).toBe('image/jpeg');
    }
    expect(close).toHaveBeenCalled();
    expect(toBlob).toHaveBeenCalled();
  });

  it('keeps original when toBlob returns null', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({
        width: 4000,
        height: 3000,
        close: vi.fn(),
      })),
    );
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        width: 0,
        height: 0,
        getContext: () => ({
          fillStyle: '',
          fillRect: vi.fn(),
          drawImage: vi.fn(),
        }),
        toBlob: (cb: (blob: Blob | null) => void) => cb(null),
      })),
    });

    const file = makeFile('huge.png', 'image/png', 3000);
    const result = await optimizeImageForUpload(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.transformed).toBe(false);
      expect(result.file).toBe(file);
      expect(result.skippedReason).toBe('encode_failed_fallback');
    }
  });

  it('keeps original when optimized blob is larger', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({
        width: 4000,
        height: 3000,
        close: vi.fn(),
      })),
    );
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        width: 0,
        height: 0,
        getContext: () => ({
          fillStyle: '',
          fillRect: vi.fn(),
          drawImage: vi.fn(),
        }),
        toBlob: (cb: (blob: Blob | null) => void, type: string) => {
          cb(new Blob([new Uint8Array(8000)], { type }));
        },
      })),
    });

    const file = makeFile('huge.webp', 'image/webp', 1000);
    const result = await optimizeImageForUpload(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.transformed).toBe(false);
      expect(result.skippedReason).toBe('not_smaller');
      expect(result.file).toBe(file);
    }
  });

  it('does not create Base64 data URLs or fake compression progress timers', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const helperSource = readFileSync(resolve(process.cwd(), 'src/lib/storage/optimize-image.ts'), 'utf8');
    expect(helperSource).not.toContain('readAsDataURL');
    expect(helperSource).not.toMatch(/data:image\//);
    expect(helperSource).not.toMatch(/setInterval\s*\([^)]*progress/i);
    expect(helperSource).toContain('imageOrientation');
  });
});
