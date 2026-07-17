import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('inline research PDF reader contracts', () => {
  it('wires Read paper on card and detail without navigating away as primary action', () => {
    const card = read('src/components/research/research-paper-card.tsx');
    const detail = read('src/components/research/research-paper-detail.tsx');
    const reader = read('src/components/research/research-pdf-reader.tsx');

    expect(card).toContain('ResearchPdfReadButton');
    expect(detail).toContain('ResearchPdfReadButton');
    expect(card).not.toContain('Open paper');
    expect(detail).not.toContain('Open paper');
    expect(reader).toContain('Read paper');
    expect(reader).toContain('Open original');
    expect(reader).toContain('role="dialog"');
    expect(reader).toContain('aria-modal="true"');
    expect(reader).toContain('useReducedMotion');
    expect(reader).toContain('lockBackgroundScroll');
    expect(reader).toContain('savedScrollY');
    expect(reader).toContain('Preview unavailable');
    expect(reader).toContain('Try again');
  });

  it('loads pdfjs only via dynamic client import', () => {
    const pages = read('src/components/research/research-pdf-pages.tsx');
    const reader = read('src/components/research/research-pdf-reader.tsx');
    expect(pages).toContain("await import('pdfjs-dist')");
    expect(reader).toContain("dynamic(");
    expect(reader).toContain("ssr: false");
    expect(cardHasNoPdfjs()).toBe(true);
  });

  it('keeps XSS contracts: no iframe in card/detail; reader uses canvas pages', () => {
    const card = read('src/components/research/research-paper-card.tsx');
    const detail = read('src/components/research/research-paper-detail.tsx');
    const pages = read('src/components/research/research-pdf-pages.tsx');
    expect(card).not.toContain('iframe');
    expect(detail).not.toContain('iframe');
    expect(pages).not.toContain('iframe');
    expect(pages).toContain("createElement('canvas')");
  });

  it('tracks paper_download once on open via onOpenTrack', () => {
    const card = read('src/components/research/research-paper-card.tsx');
    const detail = read('src/components/research/research-paper-detail.tsx');
    expect(card).toContain("eventType: 'paper_download'");
    expect(detail).toContain("eventType: 'paper_download'");
    expect(card).toContain('onOpenTrack');
    expect(detail).toContain('onOpenTrack');
  });

  it('public PDF route resolves trusted paper id only', () => {
    const route = read('src/app/api/public/research/[paperId]/pdf/route.ts');
    expect(route).toContain('fetchPublicResearchPdf');
    expect(route).toContain("searchParams.has('url')");
    expect(route).toContain('is_published');
    expect(route).not.toContain('request.json');
  });
});

function cardHasNoPdfjs() {
  const card = read('src/components/research/research-paper-card.tsx');
  const detail = read('src/components/research/research-paper-detail.tsx');
  return !card.includes('pdfjs-dist') && !detail.includes('pdfjs-dist');
}
