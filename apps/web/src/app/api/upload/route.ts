import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientIp, rateLimited, unauthorized } from '@/lib/api-utils';
import { parseJsonBody } from '@/lib/security/request';
import { isSameOriginMutation } from '@/lib/security/same-origin';
import { rateLimit } from '@/lib/rate-limit';
import { createSignedUploadIntent } from '@/lib/storage/upload-core';
import { resolveUploadOwnership } from '@/lib/storage/upload-ownership';
import { uploadRequestSchema } from '@/lib/storage/upload-request';
import { validateUploadMetadata } from '@/lib/storage/upload-validation';

function jsonNoStore(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return jsonNoStore({ error: 'Forbidden' }, 403);
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonNoStore({ error: 'Expected application/json' }, 400);
  }

  const ip = getClientIp(request);
  const ipLimit = await rateLimit(`upload:ip:${ip}`, 'upload');
  if (!ipLimit.success) {
    return rateLimited();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const userLimit = await rateLimit(`upload:user:${user.id}`, 'upload');
  if (!userLimit.success) {
    return rateLimited();
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return jsonNoStore({ error: 'Invalid request.' }, 400);
  }

  const validated = uploadRequestSchema.safeParse(parsedBody.data);
  if (!validated.success) {
    return jsonNoStore({ error: 'Invalid upload metadata.' }, 400);
  }

  const metadata = validateUploadMetadata({
    resourceType: validated.data.resourceType,
    filename: validated.data.filename,
    mimeType: validated.data.mimeType,
    size: validated.data.size,
  });

  if (!metadata.ok) {
    return jsonNoStore({ error: metadata.message }, metadata.status);
  }

  const ownership = await resolveUploadOwnership(
    supabase,
    user.id,
    validated.data.resourceType,
    validated.data.resourceId,
  );

  if (!ownership.ok) {
    return jsonNoStore({ error: ownership.message }, ownership.status);
  }

  const signed = await createSignedUploadIntent(supabase, ownership.ownership, metadata);
  if (!signed.ok) {
    return jsonNoStore({ error: signed.message }, signed.status);
  }

  return jsonNoStore(
    {
      path: signed.intent.path,
      signedUrl: signed.intent.signedUrl,
      token: signed.intent.token,
      mimeType: signed.intent.mimeType,
      maxBytes: signed.intent.maxBytes,
    },
    200,
  );
}
