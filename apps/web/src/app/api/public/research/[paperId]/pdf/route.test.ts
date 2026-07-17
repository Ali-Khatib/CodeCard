import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const mockRateLimit = vi.fn();
const mockFrom = vi.fn();
const mockFetchPublicResearchPdf = vi.fn();

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}));

vi.mock('@/lib/research/fetch-public-research-pdf', () => ({
  fetchPublicResearchPdf: (...args: unknown[]) => mockFetchPublicResearchPdf(...args),
}));

import { GET } from '@/app/api/public/research/[paperId]/pdf/route';

const PAPER_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const PDF_BYTES = new TextEncoder().encode('%PDF-1.4\n%test\n');

function makeRequest(paperId: string, search = '') {
  return new Request(`https://codecard.app/api/public/research/${paperId}/pdf${search}`, {
    method: 'GET',
  });
}

function chainable(result: { data: Record<string, unknown> | null; error?: unknown | null }) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(async () => ({
      data: result.data,
      error: result.error ?? null,
    })),
  };
  const self = () => builder;
  builder.select.mockImplementation(self);
  builder.eq.mockImplementation(self);
  return builder;
}

describe('GET /api/public/research/[paperId]/pdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it('streams PDF for a published public paper', async () => {
    mockFrom.mockReturnValue(
      chainable({
        data: {
          id: PAPER_ID,
          pdf_url: 'https://cdn.example.com/paper.pdf',
          is_published: true,
          profiles: { is_public: true },
        },
      }),
    );
    mockFetchPublicResearchPdf.mockResolvedValue({
      ok: true,
      bytes: PDF_BYTES,
      contentType: 'application/pdf',
      filename: 'paper.pdf',
    });

    const res = await GET(makeRequest(PAPER_ID), { params: Promise.resolve({ paperId: PAPER_ID }) });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(mockFetchPublicResearchPdf).toHaveBeenCalledWith('https://cdn.example.com/paper.pdf');
    const body = Buffer.from(await res.arrayBuffer()).toString('utf8');
    expect(body.startsWith('%PDF-')).toBe(true);
  });

  it('rejects draft / missing papers', async () => {
    mockFrom.mockReturnValue(chainable({ data: null }));
    const res = await GET(makeRequest(PAPER_ID), { params: Promise.resolve({ paperId: PAPER_ID }) });
    expect(res.status).toBe(404);
    expect(mockFetchPublicResearchPdf).not.toHaveBeenCalled();
  });

  it('rejects missing PDF URL', async () => {
    mockFrom.mockReturnValue(
      chainable({
        data: {
          id: PAPER_ID,
          pdf_url: null,
          is_published: true,
          profiles: { is_public: true },
        },
      }),
    );
    const res = await GET(makeRequest(PAPER_ID), { params: Promise.resolve({ paperId: PAPER_ID }) });
    expect(res.status).toBe(404);
  });

  it('rejects arbitrary URL query params', async () => {
    const res = await GET(makeRequest(PAPER_ID, '?url=https://evil.example/x.pdf'), {
      params: Promise.resolve({ paperId: PAPER_ID }),
    });
    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejects non-UUID paper ids (except demo fixtures)', async () => {
    const res = await GET(makeRequest('not-a-uuid'), {
      params: Promise.resolve({ paperId: 'not-a-uuid' }),
    });
    expect(res.status).toBe(404);
  });

  it('serves demo fixture without proxying arbitrary hosts', async () => {
    const fixture = readFileSync(
      resolve(process.cwd(), 'public/fixtures/demo-research.pdf'),
    );
    const res = await GET(makeRequest('research-demo-1'), {
      params: Promise.resolve({ paperId: 'research-demo-1' }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockFetchPublicResearchPdf).not.toHaveBeenCalled();
    const body = Buffer.from(await res.arrayBuffer());
    expect(body.equals(fixture)).toBe(true);
  });

  it('returns safe 502 when upstream fetch fails without leaking details', async () => {
    mockFrom.mockReturnValue(
      chainable({
        data: {
          id: PAPER_ID,
          pdf_url: 'https://cdn.example.com/paper.pdf',
          is_published: true,
          profiles: { is_public: true },
        },
      }),
    );
    mockFetchPublicResearchPdf.mockResolvedValue({ ok: false, reason: 'timeout' });
    const res = await GET(makeRequest(PAPER_ID), { params: Promise.resolve({ paperId: PAPER_ID }) });
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json).toEqual({ error: 'PDF unavailable' });
    expect(JSON.stringify(json)).not.toContain('timeout');
  });
});
