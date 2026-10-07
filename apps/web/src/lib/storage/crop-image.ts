import type { Area } from 'react-easy-crop';

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Could not load image for cropping.')));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

function extensionForMime(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

function stemFromFileName(fileName: string): string {
  const base = fileName.trim() || 'image';
  const dot = base.lastIndexOf('.');
  if (dot <= 0) return base;
  return base.slice(0, dot);
}

/**
 * Rasterize a react-easy-crop pixel area into an uploadable File.
 * Defaults to JPEG for broad compatibility with existing upload validators.
 */
export async function getCroppedImageFile(input: {
  imageSrc: string;
  pixelCrop: Area;
  fileName: string;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
  maxDimension?: number;
}): Promise<File> {
  const mimeType = input.mimeType ?? 'image/jpeg';
  const quality = input.quality ?? 0.92;
  const image = await createImage(input.imageSrc);

  const sourceCanvas = document.createElement('canvas');
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) {
    throw new Error('Could not prepare the crop canvas.');
  }

  sourceCanvas.width = image.width;
  sourceCanvas.height = image.height;
  sourceCtx.drawImage(image, 0, 0);

  const { x, y, width, height } = input.pixelCrop;
  const cropWidth = Math.max(1, Math.round(width));
  const cropHeight = Math.max(1, Math.round(height));
  const cropX = Math.max(0, Math.round(x));
  const cropY = Math.max(0, Math.round(y));

  let outputWidth = cropWidth;
  let outputHeight = cropHeight;
  if (input.maxDimension && Math.max(cropWidth, cropHeight) > input.maxDimension) {
    const scale = input.maxDimension / Math.max(cropWidth, cropHeight);
    outputWidth = Math.max(1, Math.round(cropWidth * scale));
    outputHeight = Math.max(1, Math.round(cropHeight * scale));
  }

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');
  if (!croppedCtx) {
    throw new Error('Could not prepare the crop canvas.');
  }

  croppedCanvas.width = outputWidth;
  croppedCanvas.height = outputHeight;
  croppedCtx.drawImage(
    sourceCanvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    croppedCanvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Could not export the cropped image.'));
          return;
        }
        resolve(result);
      },
      mimeType,
      quality,
    );
  });

  const fileName = `${stemFromFileName(input.fileName)}.${extensionForMime(mimeType)}`;
  return new File([blob], fileName, { type: mimeType, lastModified: Date.now() });
}
