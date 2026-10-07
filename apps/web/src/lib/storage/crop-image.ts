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

function averageEdgeColor(
  source: CanvasRenderingContext2D,
  width: number,
  height: number,
): string {
  const points: Array<[number, number]> = [
    [0, 0],
    [Math.max(0, width - 1), 0],
    [0, Math.max(0, height - 1)],
    [Math.max(0, width - 1), Math.max(0, height - 1)],
    [Math.floor(width / 2), 0],
    [Math.floor(width / 2), Math.max(0, height - 1)],
    [0, Math.floor(height / 2)],
    [Math.max(0, width - 1), Math.floor(height / 2)],
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const [x, y] of points) {
    const pixel = source.getImageData(x, y, 1, 1).data;
    r += pixel[0] ?? 0;
    g += pixel[1] ?? 0;
    b += pixel[2] ?? 0;
  }
  return rgb(r / points.length, g / points.length, b / points.length);
}

function rgb(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/** Average of the photo's outer edge, used to fill space when the frame is larger than the photo. */
export async function sampleImageEdgeColor(imageSrc: string): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || image.width < 1 || image.height < 1) return '#161616';
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  return averageEdgeColor(ctx, image.width, image.height);
}

/**
 * Rasterize a react-easy-crop pixel area into an uploadable File.
 * Defaults to JPEG for broad compatibility with existing upload validators.
 * Output always uses a simple name (`image.jpg`) so camera exports with
 * date dots in the stem cannot fail filename validation after crop.
 */
export async function getCroppedImageFile(input: {
  imageSrc: string;
  pixelCrop: Area;
  fileName: string;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
  maxDimension?: number;
}): Promise<File> {
  void input.fileName;
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
  const cropX = Math.round(x);
  const cropY = Math.round(y);

  let scale = 1;
  let outputWidth = cropWidth;
  let outputHeight = cropHeight;
  if (input.maxDimension && Math.max(cropWidth, cropHeight) > input.maxDimension) {
    scale = input.maxDimension / Math.max(cropWidth, cropHeight);
    outputWidth = Math.max(1, Math.round(cropWidth * scale));
    outputHeight = Math.max(1, Math.round(cropHeight * scale));
  }

  const srcX = Math.max(0, cropX);
  const srcY = Math.max(0, cropY);
  const srcRight = Math.min(image.width, cropX + cropWidth);
  const srcBottom = Math.min(image.height, cropY + cropHeight);
  const srcW = Math.max(0, srcRight - srcX);
  const srcH = Math.max(0, srcBottom - srcY);
  const extendsOutside =
    cropX < 0 || cropY < 0 || cropX + cropWidth > image.width || cropY + cropHeight > image.height;

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');
  if (!croppedCtx) {
    throw new Error('Could not prepare the crop canvas.');
  }

  croppedCanvas.width = outputWidth;
  croppedCanvas.height = outputHeight;
  if (extendsOutside) {
    croppedCtx.fillStyle = averageEdgeColor(sourceCtx, image.width, image.height);
    croppedCtx.fillRect(0, 0, outputWidth, outputHeight);
  }
  if (srcW > 0 && srcH > 0) {
    croppedCtx.drawImage(
      sourceCanvas,
      srcX,
      srcY,
      srcW,
      srcH,
      (srcX - cropX) * scale,
      (srcY - cropY) * scale,
      srcW * scale,
      srcH * scale,
    );
  }

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

  const fileName = `image.${extensionForMime(mimeType)}`;
  return new File([blob], fileName, { type: mimeType, lastModified: Date.now() });
}
