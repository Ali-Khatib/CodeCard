import type { SupabaseClient } from '@supabase/supabase-js';
import { registerAccountDeletionCapability } from '@/lib/account/delete-capabilities';

/**
 * WS10-T007 — Analytics anonymization / deletion during account deletion (server-only).
 *
 * Owner-linked raw analytics cannot remain linkable after account deletion.
 * Rows that cannot be safely anonymized (NOT NULL identity FKs) are deleted.
 * Viewer-linked rows on other owners' content are stripped of this account's identity.
 *
 * Never accepts owner/profile IDs from the client — trusted context only.
 */

export type TrustedAnalyticsAnonymizationContext = {
  authenticatedUserId: string;
  trustedOwnerUserId: string;
  tenantId: string;
  /** May already be deleted by local-content stage; used when still present. */
  profileId: string | null;
  correlationId: string;
};

export type AnalyticsAnonymizationResult =
  | {
      ok: true;
      deleted: {
        analyticsEvents: number;
        publicProfileEvents: number;
        projectViewEvents: number;
      };
      anonymized: {
        viewerAnalyticsEvents: number;
        moderationReports: number;
      };
    }
  | {
      ok: false;
      reason: 'target_mismatch' | 'service_unavailable' | 'mutation_failed';
    };

const IDENTIFYING_METADATA_KEYS = [
  'user_id',
  'userId',
  'profile_id',
  'profileId',
  'owner_user_id',
  'ownerUserId',
  'email',
  'slug',
  'display_name',
  'displayName',
  'session_id',
  'sessionId',
  'ip',
  'ip_address',
  'fingerprint',
  'referrer',
  'ua',
  'user_agent',
  'userAgent',
  'storage_path',
  'filename',
  'file_name',
] as const;

export function isAnalyticsAnonymizationConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() && env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export function registerAnalyticsAnonymizationCapability(
  env: NodeJS.ProcessEnv = process.env,
): void {
  registerAccountDeletionCapability({
    id: 'analytics_anonymization',
    label: 'Analytics anonymization',
    isAvailable: () => isAnalyticsAnonymizationConfigured(env),
  });
}

export function scrubIdentifyingAnalyticsMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if ((IDENTIFYING_METADATA_KEYS as readonly string[]).includes(key)) {
      continue;
    }
    // Drop nested objects/arrays that may embed free-text identity.
    if (value !== null && typeof value === 'object') {
      continue;
    }
    next[key] = value;
  }
  return next;
}

/**
 * Remove or anonymize analytics identity for the trusted deleted account.
 * Idempotent: repeated calls succeed with zero additional mutations when clean.
 */
export async function anonymizeTrustedAccountAnalytics(
  serviceSupabase: SupabaseClient,
  ctx: TrustedAnalyticsAnonymizationContext,
): Promise<AnalyticsAnonymizationResult> {
  if (ctx.authenticatedUserId !== ctx.trustedOwnerUserId) {
    return { ok: false, reason: 'target_mismatch' };
  }

  if (!isAnalyticsAnonymizationConfigured()) {
    return { ok: false, reason: 'service_unavailable' };
  }

  let deletedAnalyticsEvents = 0;
  let deletedPublicProfileEvents = 0;
  let deletedProjectViewEvents = 0;
  let anonymizedViewerEvents = 0;
  let anonymizedModeration = 0;

  if (ctx.profileId) {
    const profileDeletes = await deleteOwnerLinkedAnalytics(
      serviceSupabase,
      ctx.profileId,
      ctx.tenantId,
    );
    if (!profileDeletes.ok) {
      return { ok: false, reason: 'mutation_failed' };
    }
    deletedAnalyticsEvents += profileDeletes.analyticsEvents;
    deletedPublicProfileEvents += profileDeletes.publicProfileEvents;
    deletedProjectViewEvents += profileDeletes.projectViewEvents;
  }

  // Defense-in-depth: tenant-scoped legacy rows if profile id already cascaded away
  // but tenant still exists briefly during deletion.
  if (!ctx.profileId) {
    const tenantLegacy = await deleteTenantLegacyAnalytics(serviceSupabase, ctx.tenantId);
    if (!tenantLegacy.ok) {
      return { ok: false, reason: 'mutation_failed' };
    }
    deletedPublicProfileEvents += tenantLegacy.publicProfileEvents;
    deletedProjectViewEvents += tenantLegacy.projectViewEvents;
    deletedAnalyticsEvents += tenantLegacy.analyticsEvents;
  }

  const viewer = await anonymizeViewerLinkedAnalytics(
    serviceSupabase,
    ctx.trustedOwnerUserId,
  );
  if (!viewer.ok) {
    return { ok: false, reason: 'mutation_failed' };
  }
  anonymizedViewerEvents = viewer.count;

  const moderation = await anonymizeModerationReporter(
    serviceSupabase,
    ctx.trustedOwnerUserId,
  );
  if (!moderation.ok) {
    return { ok: false, reason: 'mutation_failed' };
  }
  anonymizedModeration = moderation.count;

  return {
    ok: true,
    deleted: {
      analyticsEvents: deletedAnalyticsEvents,
      publicProfileEvents: deletedPublicProfileEvents,
      projectViewEvents: deletedProjectViewEvents,
    },
    anonymized: {
      viewerAnalyticsEvents: anonymizedViewerEvents,
      moderationReports: anonymizedModeration,
    },
  };
}

async function deleteOwnerLinkedAnalytics(
  serviceSupabase: SupabaseClient,
  profileId: string,
  tenantId: string,
): Promise<
  | {
      ok: true;
      analyticsEvents: number;
      publicProfileEvents: number;
      projectViewEvents: number;
    }
  | { ok: false }
> {
  const { data: analyticsRows, error: analyticsSelectError } = await serviceSupabase
    .from('analytics_events')
    .select('id')
    .eq('profile_id', profileId)
    .eq('tenant_id', tenantId);
  if (analyticsSelectError) return { ok: false };

  if ((analyticsRows?.length ?? 0) > 0) {
    const { error } = await serviceSupabase
      .from('analytics_events')
      .delete()
      .eq('profile_id', profileId)
      .eq('tenant_id', tenantId);
    if (error) return { ok: false };
  }

  const { data: publicRows, error: publicSelectError } = await serviceSupabase
    .from('public_profile_events')
    .select('id')
    .eq('profile_id', profileId)
    .eq('tenant_id', tenantId);
  if (publicSelectError) return { ok: false };

  if ((publicRows?.length ?? 0) > 0) {
    const { error } = await serviceSupabase
      .from('public_profile_events')
      .delete()
      .eq('profile_id', profileId)
      .eq('tenant_id', tenantId);
    if (error) return { ok: false };
  }

  const { data: projectRows, error: projectSelectError } = await serviceSupabase
    .from('project_view_events')
    .select('id')
    .eq('profile_id', profileId)
    .eq('tenant_id', tenantId);
  if (projectSelectError) return { ok: false };

  if ((projectRows?.length ?? 0) > 0) {
    const { error } = await serviceSupabase
      .from('project_view_events')
      .delete()
      .eq('profile_id', profileId)
      .eq('tenant_id', tenantId);
    if (error) return { ok: false };
  }

  return {
    ok: true,
    analyticsEvents: analyticsRows?.length ?? 0,
    publicProfileEvents: publicRows?.length ?? 0,
    projectViewEvents: projectRows?.length ?? 0,
  };
}

async function deleteTenantLegacyAnalytics(
  serviceSupabase: SupabaseClient,
  tenantId: string,
): Promise<
  | {
      ok: true;
      analyticsEvents: number;
      publicProfileEvents: number;
      projectViewEvents: number;
    }
  | { ok: false }
> {
  // After profile cascade, owner profile rows should already be gone. Any remaining
  // tenant-scoped analytics without a live profile are deleted (cannot re-link safely).
  const { data: analyticsRows, error: aErr } = await serviceSupabase
    .from('analytics_events')
    .select('id, profile_id')
    .eq('tenant_id', tenantId)
    .is('profile_id', null);
  if (aErr) return { ok: false };

  if ((analyticsRows?.length ?? 0) > 0) {
    const { error } = await serviceSupabase
      .from('analytics_events')
      .delete()
      .eq('tenant_id', tenantId)
      .is('profile_id', null);
    if (error) return { ok: false };
  }

  // Legacy tables require profile_id; if profile cascaded they are already gone.
  return {
    ok: true,
    analyticsEvents: analyticsRows?.length ?? 0,
    publicProfileEvents: 0,
    projectViewEvents: 0,
  };
}

async function anonymizeViewerLinkedAnalytics(
  serviceSupabase: SupabaseClient,
  ownerUserId: string,
): Promise<{ ok: true; count: number } | { ok: false }> {
  const { data: rows, error: selectError } = await serviceSupabase
    .from('analytics_events')
    .select('id, metadata')
    .eq('user_id', ownerUserId);
  if (selectError) return { ok: false };
  if (!rows?.length) return { ok: true, count: 0 };

  for (const row of rows) {
    const metadata = scrubIdentifyingAnalyticsMetadata(
      (row.metadata ?? {}) as Record<string, unknown>,
    );
    const { error } = await serviceSupabase
      .from('analytics_events')
      .update({
        user_id: null,
        session_id: null,
        metadata,
      })
      .eq('id', row.id)
      .eq('user_id', ownerUserId);
    if (error) return { ok: false };
  }

  return { ok: true, count: rows.length };
}

async function anonymizeModerationReporter(
  serviceSupabase: SupabaseClient,
  ownerUserId: string,
): Promise<{ ok: true; count: number } | { ok: false }> {
  const { data: rows, error: selectError } = await serviceSupabase
    .from('moderation_reports')
    .select('id')
    .eq('reporter_user_id', ownerUserId);
  if (selectError) return { ok: false };
  if (!rows?.length) return { ok: true, count: 0 };

  const { error } = await serviceSupabase
    .from('moderation_reports')
    .update({ reporter_user_id: null })
    .eq('reporter_user_id', ownerUserId);
  if (error) return { ok: false };

  return { ok: true, count: rows.length };
}
