import { IMAGE_UPLOAD_OPTIMIZATION } from '@codecard/config';

export type ImageOptimizeSkipReason =
  | 'within_limits'
  | 'not_smaller'
  | 'unsupported_mime'
  | 'cancelled'
  | 'decode_failed_fallback'
  | 'encode_failed_fallback';

export type OptimizeImageSuccess = {
  ok: true;
  file: File;
  transformed: boolean;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  originalBytes: number;
  outputBytes: number;
  mimeType: string;
  skippedReason?: ImageOptimizeSkipReason;
};

export type OptimizeImageFailure = {
  ok: false;
  message: string;
  /** True when the original file may still be uploaded under existing limits. */
  canUseOriginal: boolean;
  cancelled?: boolean;
};

export type OptimizeImageResult = OptimizeImageSuccess | OptimizeImageFailure;

export type OptimizeImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  jpegQuality?: number;
  webpQuality?: number;
  signal?: AbortSignal;
};

const OPTIMIZABLE_MIME = new Set<string>(IMAGE_UPLOAD_OPTIMIZATION.mimeTypes);

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Serialize heavy decode/encode work (esp. multi-screenshot mobile). */
let optimizeQueue: Promise<void> = Promise.resolve();

function enqueueOptimize<T>(task: () => Promise<T>): Promise<T> {
  const run = optimizeQueue.then(task, task);
  optimizeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/**
 * Pure dimension fit: preserve aspect ratio, never upscale, fit inside max box.
 */
export function calculateFitDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } | { error: string } {
  if (
    !Number.isFinite(originalWidth) ||
    !Number.isFinite(originalHeight) ||
    !Number.isFinite(maxWidth) ||
    !Number.isFinite(maxHeight) ||
    originalWidth <= 0 ||
    originalHeight <= 0 ||
    maxWidth <= 0 ||
    maxHeight <= 0
  ) {
    return { error: 'Invalid image dimensions.' };
  }

  const width = Math.floor(originalWidth);
  const height = Math.floor(originalHeight);
  const maxW = Math.floor(maxWidth);
  const maxH = Math.floor(maxHeight);

  if (width <= maxW && height <= maxH) {
    return { width, height };
  }

  const scale = Math.min(maxW / width, maxH / height, 1);
  const outW = Math.max(1, Math.round(width * scale));
  const outH = Math.max(1, Math.round(height * scale));
  return { width: outW, height: outH };
}

export function shouldAttemptImageOptimization(
  width: number,
  height: number,
  maxWidth: number = IMAGE_UPLOAD_OPTIMIZATION.maxWidth,
  maxHeight: number = IMAGE_UPLOAD_OPTIMIZATION.maxHeight,
): boolean {
  return width > maxWidth || height > maxHeight;
}

export function buildOptimizedImageFilename(originalName: string, mimeType: string): string {
  const extension = MIME_TO_EXTENSION[mimeType] ?? 'jpg';
  const base = originalName.trim().split(/[/\\]/).pop() ?? 'image';
  const withoutExt = base.includes('.') ? base.slice(0, base.lastIndexOf('.')) : base;
  const safeBase =
    withoutExt
      .replace(/[^\w.\-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^\.+/, '')
      .slice(0, 80) || 'image';
  return `${safeBase}-optimized.${extension}`;
}

export function formatOptimizationSavings(originalBytes: number, outputBytes: number): string | null {
  if (!(originalBytes > outputBytes) || originalBytes <= 0) return null;
  const fmt = (n: number) => {
    if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    if (n >= 1024) return `${Math.round(n / 1024)} KB`;
    return `${n} B`;
  };
  return `Optimized from ${fmt(originalBytes)} to ${fmt(outputBytes)}`;
}

function isOptimizableMime(mime: string): boolean {
  return OPTIMIZABLE_MIME.has(mime.trim().toLowerCase());
}

type DecodedBitmap = {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  close: () => void;
};

/**
 * Orientation strategy:
 * Prefer `createImageBitmap` with `imageOrientation: 'from-image'` when the browser
 * honors it (most modern Chromium/Firefox). Fall back to HTMLImageElement decode,
 * which applies EXIF orientation in many engines when drawing to canvas.
 * We do not parse EXIF manually — complete orientation support is not claimed for every browser.
 */
async function decodeImageSource(file: File, signal?: AbortSignal): Promise<DecodedBitmap> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      } as ImageBitmapOptions);
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: (ctx, width, height) => {
          ctx.drawImage(bitmap, 0, 0, width, height);
        },
        close: () => {
          if (typeof bitmap.close === 'function') bitmap.close();
        },
      };
    } catch {
      // Fall through to HTMLImageElement.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      const onAbort = () => {
        cleanup();
        reject(new DOMException('Aborted', 'AbortError'));
      };
      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
        signal?.removeEventListener('abort', onAbort);
      };
      signal?.addEventListener('abort', onAbort, { once: true });
      img.onload = () => {
        cleanup();
        resolve(img);
      };
      img.onerror = () => {
        cleanup();
        reject(new Error('decode_failed'));
      };
      img.src = objectUrl;
    });

    return {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      draw: (ctx, width, height) => {
        ctx.drawImage(image, 0, 0, width, height);
      },
      close: () => undefined,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof canvas.toBlob !== 'function') {
      resolve(null);
      return;
    }
    try {
      if (typeof quality === 'number' && mimeType !== 'image/png') {
        canvas.toBlob((blob) => resolve(blob), mimeType, quality);
      } else {
        canvas.toBlob((blob) => resolve(blob), mimeType);
      }
    } catch {
      resolve(null);
    }
  });
}

async function optimizeImageForUploadUnqueued(
  file: File,
  options: OptimizeImageOptions = {},
): Promise<OptimizeImageResult> {
  const maxWidth = options.maxWidth ?? IMAGE_UPLOAD_OPTIMIZATION.maxWidth;
  const maxHeight = options.maxHeight ?? IMAGE_UPLOAD_OPTIMIZATION.maxHeight;
  const jpegQuality = options.jpegQuality ?? IMAGE_UPLOAD_OPTIMIZATION.jpegQuality;
  const webpQuality = options.webpQuality ?? IMAGE_UPLOAD_OPTIMIZATION.webpQuality;
  const signal = options.signal;
  const originalBytes = file.size;
  const mimeType = file.type.trim().toLowerCase();

  if (signal?.aborted) {
    return {
      ok: false,
      message: 'Upload cancelled.',
      canUseOriginal: true,
      cancelled: true,
    };
  }

  if (!file.size || file.size <= 0) {
    return {
      ok: false,
      message: 'File size must be greater than zero.',
      canUseOriginal: false,
    };
  }

  if (!isOptimizableMime(mimeType)) {
    return {
      ok: true,
      file,
      transformed: false,
      originalWidth: 0,
      originalHeight: 0,
      outputWidth: 0,
      outputHeight: 0,
      originalBytes,
      outputBytes: originalBytes,
      mimeType,
      skippedReason: 'unsupported_mime',
    };
  }

  let decoded: DecodedBitmap;
  try {
    decoded = await decodeImageSource(file, signal);
  } catch (error) {
    if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      return {
        ok: false,
        message: 'Upload cancelled.',
        canUseOriginal: true,
        cancelled: true,
      };
    }
    return {
      ok: true,
      file,
      transformed: false,
      originalWidth: 0,
      originalHeight: 0,
      outputWidth: 0,
      outputHeight: 0,
      originalBytes,
      outputBytes: originalBytes,
      mimeType,
      skippedReason: 'decode_failed_fallback',
    };
  }

  try {
    const fitted = calculateFitDimensions(decoded.width, decoded.height, maxWidth, maxHeight);
    if ('error' in fitted) {
      return {
        ok: true,
        file,
        transformed: false,
        originalWidth: decoded.width,
        originalHeight: decoded.height,
        outputWidth: decoded.width,
        outputHeight: decoded.height,
        originalBytes,
        outputBytes: originalBytes,
        mimeType,
        skippedReason: 'decode_failed_fallback',
      };
    }

    if (!shouldAttemptImageOptimization(decoded.width, decoded.height, maxWidth, maxHeight)) {
      return {
        ok: true,
        file,
        transformed: false,
        originalWidth: decoded.width,
        originalHeight: decoded.height,
        outputWidth: fitted.width,
        outputHeight: fitted.height,
        originalBytes,
        outputBytes: originalBytes,
        mimeType,
        skippedReason: 'within_limits',
      };
    }

    if (signal?.aborted) {
      return {
        ok: false,
        message: 'Upload cancelled.',
        canUseOriginal: true,
        cancelled: true,
      };
    }

    if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
      return {
        ok: true,
        file,
        transformed: false,
        originalWidth: decoded.width,
        originalHeight: decoded.height,
        outputWidth: decoded.width,
        outputHeight: decoded.height,
        originalBytes,
        outputBytes: originalBytes,
        mimeType,
        skippedReason: 'encode_failed_fallback',
      };
    }

    const canvas = document.createElement('canvas');
    canvas.width = fitted.width;
    canvas.height = fitted.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return {
        ok: true,
        file,
        transformed: false,
        originalWidth: decoded.width,
        originalHeight: decoded.height,
        outputWidth: decoded.width,
        outputHeight: decoded.height,
        originalBytes,
        outputBytes: originalBytes,
        mimeType,
        skippedReason: 'encode_failed_fallback',
      };
    }

    // Preserve PNG/WebP alpha; avoid fill that would destroy transparency.
    if (mimeType === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, fitted.width, fitted.height);
    }

    decoded.draw(ctx, fitted.width, fitted.height);

    const quality =
      mimeType === 'image/jpeg' ? jpegQuality : mimeType === 'image/webp' ? webpQuality : undefined;

    const blob = await canvasToBlob(canvas, mimeType, quality);

    // If the browser cannot encode the requested type, keep the original (never mislabel).
    if (!blob || blob.size <= 0 || (blob.type && blob.type !== mimeType)) {
      canvas.width = 0;
      canvas.height = 0;
      return {
        ok: true,
        file,
        transformed: false,
        originalWidth: decoded.width,
        originalHeight: decoded.height,
        outputWidth: decoded.width,
        outputHeight: decoded.height,
        originalBytes,
        outputBytes: originalBytes,
        mimeType,
        skippedReason: 'encode_failed_fallback',
      };
    }

    // Prefer original when optimization is not smaller.
    if (blob.size >= originalBytes) {
      canvas.width = 0;
      canvas.height = 0;
      return {
        ok: true,
        file,
        transformed: false,
        originalWidth: decoded.width,
        originalHeight: decoded.height,
        outputWidth: fitted.width,
        outputHeight: fitted.height,
        originalBytes,
        outputBytes: originalBytes,
        mimeType,
        skippedReason: 'not_smaller',
      };
    }

    const optimizedFile = new File([blob], buildOptimizedImageFilename(file.name, mimeType), {
      type: mimeType,
      lastModified: Date.now(),
    });

    canvas.width = 0;
    canvas.height = 0;

    return {
      ok: true,
      file: optimizedFile,
      transformed: true,
      originalWidth: decoded.width,
      originalHeight: decoded.height,
      outputWidth: fitted.width,
      outputHeight: fitted.height,
      originalBytes,
      outputBytes: optimizedFile.size,
      mimeType,
    };
  } finally {
    decoded.close();
  }
}

/**
 * Resize/re-encode approved raster images before signed upload authorization.
 * Falls back to the original file when safe; never invents progress percentages.
 */
export function optimizeImageForUpload(
  file: File,
  options: OptimizeImageOptions = {},
): Promise<OptimizeImageResult> {
  return enqueueOptimize(() => optimizeImageForUploadUnqueued(file, options));
}
