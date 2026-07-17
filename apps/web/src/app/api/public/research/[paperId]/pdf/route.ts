import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientIp, rateLimited } from '@/lib/api-utils';
import { rateLimit } from '@/lib/rate-limit';
import { fetchPublicResearchPdf } from '@/lib/research/fetch-public-research-pdf';
import { isDemoResearchPaperId } from '@/lib/research/public-research-pdf-path';
import { toSafeExternalPdfHref } from '@/lib/security/safe-href';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ paperId: string }>;
};

function pdfResponse(bytes: Buffer | Uint8Array, filename: string) {
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Length': String(bytes.byteLength),
    },
  });
}

/**
 * Same-origin PDF delivery for published research papers.
 * Resolves pdf_url from the trusted DB row — never accepts a client-supplied fetch URL.
 */
export async function GET(request: Request, context: RouteContext) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`publicResearchPdf:${ip}`, 'publicResearchPdf');
  if (!rl.success) {
    return rateLimited();
  }

  const { paperId } = await context.params;

  // Reject any attempt to pass an arbitrary URL via query string.
  const url = new URL(request.url);
  if (url.searchParams.has('url') || url.searchParams.has('src') || url.searchParams.has('pdf')) {
    return NextResponse.json({ error: 'Not found' }, { status: 400 });
  }

  // Demo portfolio papers are not DB-backed; serve the local fixture only.
  if (isDemoResearchPaperId(paperId)) {
    try {
      const fixture = await readFile(join(process.cwd(), 'public/fixtures/demo-research.pdf'));
      return pdfResponse(fixture, 'demo-research.pdf');
    } catch {
      return NextResponse.json({ error: 'PDF unavailable' }, { status: 502 });
    }
  }

  if (!UUID_RE.test(paperId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: paper, error } = await supabase
    .from('research_papers')
    .select('id, pdf_url, is_published, profiles!inner(is_public)')
    .eq('id', paperId)
    .eq('is_published', true)
    .eq('profiles.is_public', true)
    .maybeSingle();

  if (error || !paper) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const pdfUrl = toSafeExternalPdfHref(paper.pdf_url);
  if (!pdfUrl) {
    return NextResponse.json({ error: 'PDF unavailable' }, { status: 404 });
  }

  const fetched = await fetchPublicResearchPdf(pdfUrl);
  if (!fetched.ok) {
    return NextResponse.json({ error: 'PDF unavailable' }, { status: 502 });
  }

  return pdfResponse(fetched.bytes, fetched.filename);
}
