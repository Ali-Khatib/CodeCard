/**
 * Client-side helper: turn a picked image into a bounded inline data URL for a
 * showcase-section background. Sizes are kept small so the whole project form
 * (all five sections) stays under the server-action body limit.
 */

export const CASE_STUDY_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

export const CASE_STUDY_IMAGE_MAX_SOURCE_BYTES = 10 * 1024 * 1024;

/** Bounded well below the 600k-char schema cap; 5 images must fit one request. */
export const CASE_STUDY_IMAGE_MAX_DATA_URL_CHARS = 160_000;

const MAX_DIMENSION = 1600;
const QUALITY_STEPS = [0.82, 0.7, 0.58, 0.46, 0.34];
const DIMENSION_STEPS = [1600, 1280, 1024, 800, 640];

export type CaseStudyImageResult =
  | { ok: true; dataUrl: string }
  | { ok: false; message: string };

export function validateCaseStudyImageFile(file: File): { ok: true } | { ok: false; message: string } {
  const allowed = CASE_STUDY_IMAGE_ACCEPT.split(',');
  if (!allowed.includes(file.type)) {
    return { ok: false, message: 'Use a JPEG, PNG, or WebP image.' };
  }
  if (file.size > CASE_STUDY_IMAGE_MAX_SOURCE_BYTES) {
    return { ok: false, message: 'Image must be under 10 MB.' };
  }
  return { ok: true };
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolvePromise, rejectPromise) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolvePromise(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      rejectPromise(new Error('unreadable image'));
    };
    image.src = objectUrl;
  });
}

function drawToDataUrl(
  image: HTMLImageElement,
  maxDimension: number,
  quality: number,
): string | null {
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(image, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/webp', quality);
  // Browsers without webp encoding return a PNG data URL instead.
  if (!dataUrl.startsWith('data:image/webp')) {
    return canvas.toDataURL('image/jpeg', quality);
  }
  return dataUrl;
}

/**
 * Compress the file into a data URL no longer than
 * CASE_STUDY_IMAGE_MAX_DATA_URL_CHARS, stepping down quality then dimensions.
 */
export async function compressCaseStudyImage(file: File): Promise<CaseStudyImageResult> {
  const valid = validateCaseStudyImageFile(file);
  if (!valid.ok) return valid;

  let image: HTMLImageElement;
  try {
    image = await loadImageElement(file);
  } catch {
    return { ok: false, message: 'Could not read this image. Try a different file.' };
  }

  for (const dimension of DIMENSION_STEPS) {
    if (dimension > MAX_DIMENSION) continue;
    for (const quality of QUALITY_STEPS) {
      const dataUrl = drawToDataUrl(image, dimension, quality);
      if (!dataUrl) {
        return { ok: false, message: 'Could not process this image in your browser.' };
      }
      if (dataUrl.length <= CASE_STUDY_IMAGE_MAX_DATA_URL_CHARS) {
        return { ok: true, dataUrl };
      }
    }
  }

  return {
    ok: false,
    message: 'This image is too detailed to compress. Try a smaller or simpler image.',
  };
}
