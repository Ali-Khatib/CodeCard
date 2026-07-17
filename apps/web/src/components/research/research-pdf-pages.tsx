'use client';

import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';

export type ResearchPdfPagesStatus = 'loading' | 'ready' | 'error';

/**
 * Client-only PDF.js page renderer. Dynamically imported so the app bundle
 * does not ship pdfjs until the reader opens.
 */
export function ResearchPdfPages({
  src,
  onStatusChange,
  retryKey = 0,
}: {
  src: string;
  onStatusChange?: (status: ResearchPdfPagesStatus) => void;
  retryKey?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ResearchPdfPagesStatus>('loading');
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;
    let pdfDoc: PDFDocumentProxy | null = null;
    const canvases: HTMLCanvasElement[] = [];

    async function render() {
      setStatus('loading');
      onStatusChange?.('loading');
      setPageCount(0);

      const container = containerRef.current;
      if (!container) return;
      container.replaceChildren();

      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        loadingTask = pdfjs.getDocument({
          url: src,
          withCredentials: false,
          useSystemFonts: true,
        });

        pdfDoc = await loadingTask.promise;
        if (cancelled) {
          await pdfDoc.cleanup();
          return;
        }

        setPageCount(pdfDoc.numPages);

        for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
          if (cancelled) break;
          const page = await pdfDoc.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const availableWidth = Math.max(280, container.clientWidth - 8);
          const scale = Math.min(2.25, availableWidth / baseViewport.width);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.className = 'mx-auto mb-4 block w-full max-w-full rounded-md bg-white shadow-sm';
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', `Page ${pageNumber} of ${pdfDoc.numPages}`);
          const context = canvas.getContext('2d', { alpha: false });
          if (!context) {
            throw new Error('canvas_unavailable');
          }

          const outputScale = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;
          context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

          await page.render({ canvasContext: context, viewport, canvas }).promise;
          if (cancelled) break;
          container.appendChild(canvas);
          canvases.push(canvas);
        }

        if (!cancelled) {
          setStatus('ready');
          onStatusChange?.('ready');
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
          onStatusChange?.('error');
        }
      }
    }

    void render();

    return () => {
      cancelled = true;
      void loadingTask?.destroy().catch(() => undefined);
      void pdfDoc?.cleanup().catch(() => undefined);
      for (const canvas of canvases) {
        canvas.remove();
      }
    };
  }, [src, retryKey, onStatusChange]);

  return (
    <div className="w-full min-w-0">
      {status === 'loading' && (
        <p className="py-16 text-center text-[15px] text-[var(--app-smoke)]" role="status" aria-live="polite">
          Loading paper…
        </p>
      )}
      <div
        ref={containerRef}
        className="w-full min-w-0 overflow-x-hidden"
        data-pdf-pages={pageCount || undefined}
        data-pdf-status={status}
        aria-busy={status === 'loading'}
      />
    </div>
  );
}
