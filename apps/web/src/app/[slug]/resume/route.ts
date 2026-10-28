import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { resolvePublicResumeDownload } from '@/lib/profile/resume-core';
import { normalizePublicProfileSlug } from '@/lib/profile/public-profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = normalizePublicProfileSlug(rawSlug);
  if (!slug) {
    return new NextResponse('Not found', { status: 404 });
  }

  const supabase = await createClient();
  const service = await createServiceClient();
  const result = await resolvePublicResumeDownload(supabase, service, slug);

  if (!result.ok) {
    return new NextResponse(result.message, { status: result.status });
  }

  return NextResponse.redirect(result.signedUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'private, no-store',
    },
  });
}
