import { NextResponse } from 'next/server';
import {
  projectCoverUploadSchema,
  projectScreenshotUploadSchema,
  researchFigureUploadSchema,
  type ProjectMediaRole,
} from '@codecard/validation';
import { createClient } from '@/lib/supabase/server';
import { getClientIp, unauthorized } from '@/lib/api-utils';
import { recoverySessionForbiddenResponse } from '@/lib/auth/recovery-session-guard';
import { parseJsonBody } from '@/lib/security/request';
import { isSameOriginMutation } from '@/lib/security/same-origin';
import { FEATURE_DISABLED_MESSAGE, isFeatureBlocked } from '@/lib/security/kill-switch';
import { rateLimit, type RateLimitResult } from '@/lib/rate-limit';
import { assertProjectMediaUploadAllowed } from '@/lib/projects/project-media-core';
import { assertResearchFigureUploadAllowed } from '@/lib/research/research-figure-core';
import { assertResearchCoverUploadAllowed } from '@/lib/research/research-cover-core';
import { createSignedUploadIntent } from '@/lib/storage/upload-core';
import { resolveUploadOwnership } from '@/lib/storage/upload-ownership';
import { uploadRequestSchema } from '@/lib/storage/upload-request';
import { validateUploadContentPrefix } from '@/lib/storage/upload-content-prefix';
import { validateUploadMetadata } from '@/lib/storage/upload-validation';

function jsonNoStore(body: unknown, status: number, extraHeaders?: Record<string, string>) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

/**
 * Quota exhaustion stays 429. Missing or unreachable Redis stays a denial,
 * but it is a service failure, not "too many requests".
 */
function denyUploadRateLimit(decision: RateLimitResult) {
  if (decision.success) return null;
  if (decision.denial === 'misconfigured' || decision.denial === 'unavailable') {
    return jsonNoStore(
      {
        error: 'Photo upload is temporarily unavailable. Try again shortly.',
        code: 'upload_unavailable',
      },
      503,
    );
  }
  const headers: Record<string, string> = {};
  if (decision.retryAfterSeconds && decision.retryAfterSeconds > 0) {
    headers['Retry-After'] = String(decision.retryAfterSeconds);
  }
  return jsonNoStore({ error: 'Too many requests', code: 'rate_limited' }, 429, headers);
}

/** Platform-set forwarding headers only. A missing IP must not share one global bucket. */
function trustedUploadIp(request: Request): string | null {
  const ip = getClientIp(request);
  if (!ip || ip === 'unknown') return null;
  return ip;
}

export async function POST(request: Request) {
  /* Emergency disable before any auth lookup or storage side effect. */
  if (isFeatureBlocked('uploads')) {
    return jsonNoStore({ error: FEATURE_DISABLED_MESSAGE }, 503);
  }

  if (!isSameOriginMutation(request)) {
    return jsonNoStore({ error: 'Forbidden' }, 403);
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonNoStore({ error: 'Expected application/json' }, 400);
  }

  const started = performance.now();
  const ip = trustedUploadIp(request);
  if (ip) {
    const rateStarted = performance.now();
    const ipLimit = await rateLimit(`upload:ip:${ip}`, 'upload');
    if (process.env.NODE_ENV === 'development') {
      console.info('[upload] rate-limit', {
        scope: 'ip',
        ms: Math.round(performance.now() - rateStarted),
        denied: !ipLimit.success,
        denial: ipLimit.denial ?? null,
      });
    }
    const denied = denyUploadRateLimit(ipLimit);
    if (denied) return denied;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const recoveryBlocked = recoverySessionForbiddenResponse(user);
  if (recoveryBlocked) return recoveryBlocked;

  const userRateStarted = performance.now();
  const userLimit = await rateLimit(`upload:user:${user.id}`, 'upload');
  if (process.env.NODE_ENV === 'development') {
    console.info('[upload] rate-limit', {
      scope: 'account',
      ms: Math.round(performance.now() - userRateStarted),
      denied: !userLimit.success,
      denial: userLimit.denial ?? null,
    });
  }
  const userDenied = denyUploadRateLimit(userLimit);
  if (userDenied) return userDenied;

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return jsonNoStore({ error: 'Invalid request.' }, 400);
  }

  const validated = uploadRequestSchema.safeParse(parsedBody.data);
  if (!validated.success) {
    return jsonNoStore({ error: 'Invalid upload metadata.' }, 400);
  }

  const content = validateUploadContentPrefix({
    mimeType: validated.data.mimeType,
    contentPrefixBase64: validated.data.contentPrefixBase64,
  });
  if (!content.ok) {
    return jsonNoStore({ error: content.message }, content.status);
  }

  // Private PDF uploads remain intentionally disabled (WS04-T007 external links only).
  if (validated.data.resourceType === 'private-doc') {
    return jsonNoStore({ error: 'Private document uploads are not available.' }, 403);
  }

  if (validated.data.resourceType === 'project-media') {
    if (!validated.data.resourceId || !validated.data.mediaRole) {
      return jsonNoStore({ error: 'Invalid upload metadata.' }, 400);
    }

    const projectUploadSchema =
      validated.data.mediaRole === 'poster'
        ? projectCoverUploadSchema
        : projectScreenshotUploadSchema;

    const projectValidated = projectUploadSchema.safeParse({
      project_id: validated.data.resourceId,
      media_role: validated.data.mediaRole,
      filename: validated.data.filename,
      mime_type: validated.data.mimeType,
      size: validated.data.size,
    });

    if (!projectValidated.success) {
      const issue = projectValidated.error.issues[0];
      if (issue?.message === 'File is too large') {
        return jsonNoStore({ error: 'File is too large.' }, 413);
      }
      if (issue?.message === 'Unsupported file type' || issue?.message === 'File type does not match filename') {
        return jsonNoStore({ error: 'Unsupported file type.' }, 415);
      }
      return jsonNoStore({ error: 'Invalid upload metadata.' }, 400);
    }
  }

  if (validated.data.resourceType === 'research-figure') {
    if (!validated.data.resourceId) {
      return jsonNoStore({ error: 'Invalid upload metadata.' }, 400);
    }

    const figureValidated = researchFigureUploadSchema.safeParse({
      research_paper_id: validated.data.resourceId,
      filename: validated.data.filename,
      mime_type: validated.data.mimeType,
      size: validated.data.size,
    });

    if (!figureValidated.success) {
      const issue = figureValidated.error.issues[0];
      if (issue?.message === 'File is too large') {
        return jsonNoStore({ error: 'File is too large.' }, 413);
      }
      if (issue?.message === 'Unsupported file type' || issue?.message === 'File type does not match filename') {
        return jsonNoStore({ error: 'Unsupported file type.' }, 415);
      }
      return jsonNoStore({ error: 'Invalid upload metadata.' }, 400);
    }
  }

  const metadata = validateUploadMetadata({
    resourceType: validated.data.resourceType,
    filename: validated.data.filename,
    mimeType: validated.data.mimeType,
    size: validated.data.size,
    mediaRole: validated.data.mediaRole as ProjectMediaRole | undefined,
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

  if (validated.data.resourceType === 'project-media' && validated.data.resourceId && validated.data.mediaRole) {
    const allowed = await assertProjectMediaUploadAllowed(supabase, {
      userId: user.id,
      projectId: validated.data.resourceId,
      mediaRole: validated.data.mediaRole,
    });
    if (!allowed.ok) {
      return jsonNoStore({ error: allowed.message }, allowed.status);
    }
  }

  if (validated.data.resourceType === 'research-figure' && validated.data.resourceId) {
    const allowed =
      validated.data.purpose === 'cover'
        ? await assertResearchCoverUploadAllowed(supabase, {
            userId: user.id,
            researchPaperId: validated.data.resourceId,
          })
        : await assertResearchFigureUploadAllowed(supabase, {
            userId: user.id,
            researchPaperId: validated.data.resourceId,
          });
    if (!allowed.ok) {
      return jsonNoStore({ error: allowed.message }, allowed.status);
    }
  }

  const signed = await createSignedUploadIntent(supabase, ownership.ownership, metadata);
  if (!signed.ok) {
    return jsonNoStore({ error: signed.message }, signed.status);
  }

  if (process.env.NODE_ENV === 'development') {
    console.info('[upload] authorized', { ms: Math.round(performance.now() - started) });
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
