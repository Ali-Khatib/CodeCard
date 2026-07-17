import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CIRCLE_ACTIVITY_TABLE,
  buildPublishDedupeKey,
  buildUpdateDedupeKey,
  isCircleActivityEventType,
  targetTypeForEvent,
  type CircleActivityEventType,
} from '@/lib/circle/circle-activity-contract';
import {
  projectContentFingerprint,
  researchContentFingerprint,
} from '@/lib/circle/circle-fingerprint';

export type EmitCircleActivityInput = {
  tenantId: string;
  actorProfileId: string;
  eventType: CircleActivityEventType;
  targetId: string;
  /** Required for update events; ignored for publish (uses publish dedupe key). */
  contentFingerprint?: string;
};

export type EmitCircleActivityResult =
  | { ok: true; emitted: boolean; dedupeKey: string }
  | { ok: false; code: 'INVALID_EVENT' | 'TEMPORARY_FAILURE'; error: string };

/**
 * Idempotent activity emission. Unique dedupe_key conflicts are treated as success
 * without duplicating rows. Publication success must not be rolled back if emit fails;
 * callers may log and continue (consistency: best-effort after successful mutation).
 */
export async function emitCircleActivity(
  supabase: SupabaseClient,
  input: EmitCircleActivityInput,
): Promise<EmitCircleActivityResult> {
  if (!isCircleActivityEventType(input.eventType)) {
    return { ok: false, code: 'INVALID_EVENT', error: 'Unsupported activity type.' };
  }

  const targetType = targetTypeForEvent(input.eventType);
  const isPublish =
    input.eventType === 'project_published' || input.eventType === 'research_published';

  let dedupeKey: string;
  if (isPublish) {
    dedupeKey = buildPublishDedupeKey(targetType, input.targetId);
  } else {
    const fingerprint = input.contentFingerprint?.trim();
    if (!fingerprint) {
      return { ok: false, code: 'INVALID_EVENT', error: 'Update events require a content fingerprint.' };
    }
    dedupeKey = buildUpdateDedupeKey(targetType, input.targetId, fingerprint);
  }

  const { error } = await supabase.from(CIRCLE_ACTIVITY_TABLE).upsert(
    {
      tenant_id: input.tenantId,
      actor_profile_id: input.actorProfileId,
      event_type: input.eventType,
      target_type: targetType,
      target_id: input.targetId,
      dedupe_key: dedupeKey,
      metadata: {},
      created_at: new Date().toISOString(),
    },
    { onConflict: 'dedupe_key', ignoreDuplicates: isPublish },
  );

  if (error) {
    if (error.code === '23505') {
      return { ok: true, emitted: false, dedupeKey };
    }
    return {
      ok: false,
      code: 'TEMPORARY_FAILURE',
      error: 'Could not record Circle activity.',
    };
  }

  return { ok: true, emitted: true, dedupeKey };
}

export async function emitProjectPublishedActivity(
  supabase: SupabaseClient,
  input: { tenantId: string; actorProfileId: string; projectId: string },
): Promise<EmitCircleActivityResult> {
  return emitCircleActivity(supabase, {
    tenantId: input.tenantId,
    actorProfileId: input.actorProfileId,
    eventType: 'project_published',
    targetId: input.projectId,
  });
}

export async function emitResearchPublishedActivity(
  supabase: SupabaseClient,
  input: { tenantId: string; actorProfileId: string; researchPaperId: string },
): Promise<EmitCircleActivityResult> {
  return emitCircleActivity(supabase, {
    tenantId: input.tenantId,
    actorProfileId: input.actorProfileId,
    eventType: 'research_published',
    targetId: input.researchPaperId,
  });
}

export async function emitProjectUpdatedActivity(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    actorProfileId: string;
    projectId: string;
    title: string;
    tagline: string | null;
    description: string | null;
    slug: string;
    technologies: string[];
    status: string | null;
  },
): Promise<EmitCircleActivityResult> {
  return emitCircleActivity(supabase, {
    tenantId: input.tenantId,
    actorProfileId: input.actorProfileId,
    eventType: 'project_updated',
    targetId: input.projectId,
    contentFingerprint: projectContentFingerprint(input),
  });
}

export async function emitResearchUpdatedActivity(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    actorProfileId: string;
    researchPaperId: string;
    title: string;
    abstract: string | null;
    slug: string;
    authors: string[];
    venue: string | null;
    publication_status: string | null;
    pdf_url: string | null;
    cover_image_url: string | null;
    year: number | null;
  },
): Promise<EmitCircleActivityResult> {
  return emitCircleActivity(supabase, {
    tenantId: input.tenantId,
    actorProfileId: input.actorProfileId,
    eventType: 'research_updated',
    targetId: input.researchPaperId,
    contentFingerprint: researchContentFingerprint(input),
  });
}
