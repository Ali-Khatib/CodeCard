import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveOwnedProfile } from '@/lib/profile/profile-auth-core';
import { resolveTenantPlanId } from '@/lib/projects/project-plan-core';

export const AI_OWNER_RESULTS_TABLE = 'ai_owner_results' as const;

export const AI_OWNER_RESULT_KINDS = ['project_draft', 'analytics_review'] as const;

export type AiOwnerResultKind = (typeof AI_OWNER_RESULT_KINDS)[number];

export const AI_OWNER_RESULT_LIMIT = 24;

export const AI_OWNER_RESULT_TITLE_MAX = 160;

export const AI_OWNER_RESULT_BODY_MAX_CHARS = 24_000;

export const AI_OWNER_RESULT_PRO_MESSAGE =
  'Saving an AI project draft or Analysis review is part of Pro.';

export type SaveAiOwnerResultInput = {
  kind: string;
  title: string;
  body: unknown;
};

export type SaveAiOwnerResultCode =
  | 'UNAUTHENTICATED'
  | 'NOT_PRO'
  | 'INVALID_INPUT'
  | 'LIMIT_REACHED'
  | 'PERSISTENCE_FAILED';

export type SaveAiOwnerResultResult =
  | { ok: true; id: string }
  | { ok: false; code: SaveAiOwnerResultCode; error: string };

function isKind(value: string): value is AiOwnerResultKind {
  return (AI_OWNER_RESULT_KINDS as readonly string[]).includes(value);
}

function plainBody(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/**
 * Persists one saved AI result for the signed-in owner.
 * The plan comes from subscriptions. The client cannot choose the owner or the tenant.
 * `serviceClient` is required because authenticated clients have no INSERT grant.
 */
export async function saveAiOwnerResult(
  userClient: SupabaseClient,
  serviceClient: SupabaseClient,
  userId: string | null,
  input: SaveAiOwnerResultInput,
): Promise<SaveAiOwnerResultResult> {
  if (!userId) {
    return { ok: false, code: 'UNAUTHENTICATED', error: 'You must be signed in.' };
  }

  const title = input.title.trim();
  const body = plainBody(input.body);
  let serialized = '';
  try {
    serialized = body ? JSON.stringify(body) : '';
  } catch {
    serialized = '';
  }

  if (
    !isKind(input.kind) ||
    title.length < 1 ||
    title.length > AI_OWNER_RESULT_TITLE_MAX ||
    !body ||
    serialized.length < 2 ||
    serialized.length > AI_OWNER_RESULT_BODY_MAX_CHARS
  ) {
    return { ok: false, code: 'INVALID_INPUT', error: 'That saved result is not valid.' };
  }

  const owned = await resolveOwnedProfile(userClient, { id: userId });
  if ('error' in owned) {
    return { ok: false, code: 'UNAUTHENTICATED', error: owned.error };
  }

  const planId = await resolveTenantPlanId(userClient, owned.profile.tenant_id);
  if (planId !== 'pro') {
    return { ok: false, code: 'NOT_PRO', error: AI_OWNER_RESULT_PRO_MESSAGE };
  }

  const existing = await serviceClient
    .from(AI_OWNER_RESULTS_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('owner_user_id', owned.profile.owner_user_id)
    .eq('kind', input.kind);

  if (existing.error || existing.count == null) {
    return { ok: false, code: 'PERSISTENCE_FAILED', error: 'Could not save that result.' };
  }
  if (existing.count >= AI_OWNER_RESULT_LIMIT) {
    return {
      ok: false,
      code: 'LIMIT_REACHED',
      error: `You can keep ${AI_OWNER_RESULT_LIMIT} saved ${input.kind === 'project_draft' ? 'project drafts' : 'Analysis reviews'}.`,
    };
  }

  const inserted = await serviceClient
    .from(AI_OWNER_RESULTS_TABLE)
    .insert({
      tenant_id: owned.profile.tenant_id,
      owner_user_id: owned.profile.owner_user_id,
      kind: input.kind,
      title,
      body,
    })
    .select('id')
    .single();

  const id = (inserted.data as { id?: string } | null)?.id;
  if (inserted.error || !id) {
    return { ok: false, code: 'PERSISTENCE_FAILED', error: 'Could not save that result.' };
  }

  return { ok: true, id };
}
