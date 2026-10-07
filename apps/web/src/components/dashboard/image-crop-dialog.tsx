'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { getCroppedImageFile, sampleImageEdgeColor } from '@/lib/storage/crop-image';

export type ImageCropDialogProps = {
  open: boolean;
  imageSrc: string;
  fileName: string;
  title: string;
  description?: string;
  aspect: number;
  cropShape?: 'rect' | 'round';
  confirmLabel?: string;
  maxOutputDimension?: number;
  /** Lowest slider value. Below 1 lets the photo sit inside the frame instead of filling it. */
  minZoom?: number;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ImageCropDialog({
  open,
  imageSrc,
  fileName,
  title,
  description = 'Drag to reposition. Use the slider to zoom.',
  aspect,
  cropShape = 'rect',
  confirmLabel = 'Use photo',
  maxOutputDimension,
  minZoom = 1,
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const titleId = useId();
  const descId = useId();
  const zoomId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [matte, setMatte] = useState('#161616');

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setApplying(false);
    setError('');
    setMatte('#161616');
  }, [open, imageSrc]);

  useEffect(() => {
    if (!open || minZoom >= 1) return;
    let cancelled = false;
    void sampleImageEdgeColor(imageSrc)
      .then((color) => {
        if (!cancelled) setMatte(color);
      })
      .catch(() => {
        if (!cancelled) setMatte('#161616');
      });
    return () => {
      cancelled = true;
    };
  }, [imageSrc, minZoom, open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    cancelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (applying) return;
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [applying, onCancel, open]);

  const handleCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels || applying) return;
    setApplying(true);
    setError('');
    try {
      const file = await getCroppedImageFile({
        imageSrc,
        pixelCrop: croppedAreaPixels,
        fileName,
        mimeType: 'image/jpeg',
        quality: 0.92,
        maxDimension: maxOutputDimension,
      });
      onConfirm(file);
    } catch {
      setError('Could not crop this image. Please try another photo.');
      setApplying(false);
    }
  }, [applying, croppedAreaPixels, fileName, imageSrc, maxOutputDimension, onConfirm]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !applying) {
          onCancel();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        data-testid="image-crop-dialog"
        className="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[var(--app-border)] bg-[var(--app-canvas)] shadow-xl sm:rounded-2xl"
      >
        <div className="border-b border-[var(--app-border)] px-5 py-4">
          <h2 id={titleId} className="text-[17px] font-medium tracking-[-0.02em] text-[var(--app-ink)]">
            {title}
          </h2>
          <p id={descId} className="mt-1 text-[13px] text-[var(--app-smoke)]">
            {description}
          </p>
        </div>

        <div
          className={`relative mx-5 mt-4 overflow-hidden rounded-xl bg-black ${
            aspect < 1 ? 'h-80 sm:h-[24rem]' : 'h-64 sm:h-72'
          }`}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={cropShape === 'rect'}
            minZoom={minZoom}
            maxZoom={3}
            restrictPosition={minZoom >= 1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            objectFit="contain"
            style={{ containerStyle: { backgroundColor: matte } }}
          />
        </div>

        <div className="px-5 py-4">
          <label htmlFor={zoomId} className="text-[13px] text-[var(--app-smoke)]">
            Zoom
          </label>
          <input
            id={zoomId}
            type="range"
            min={minZoom}
            max={3}
            step={0.01}
            value={zoom}
            disabled={applying}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="mt-2 w-full accent-[var(--app-ink)]"
            aria-valuemin={minZoom}
            aria-valuemax={3}
            aria-valuenow={zoom}
          />
        </div>

        {error ? (
          <p role="alert" className="px-5 pb-2 text-[13px] text-red-600">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--app-border)] px-5 py-4">
          <button
            ref={cancelRef}
            type="button"
            data-confirm-cancel
            className="cc-app-btn cc-app-btn--ghost"
            disabled={applying}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cc-app-btn cc-app-btn--primary"
            disabled={applying || !croppedAreaPixels}
            onClick={() => void handleConfirm()}
          >
            {applying ? 'Applying…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
