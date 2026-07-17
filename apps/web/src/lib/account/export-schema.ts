import { z } from 'zod';

export const ACCOUNT_EXPORT_SCHEMA_VERSION = '1.0' as const;
export const ACCOUNT_EXPORT_MAX_BYTES = 4 * 1024 * 1024;

export const accountExportRequestSchema = z
  .object({
    format: z.literal('json').optional(),
  })
  .strict();

export type AccountExportRequest = z.infer<typeof accountExportRequestSchema>;

const isoTimestamp = z.string().datetime();

const mediaMetadataSchema = z
  .object({
    id: z.string().uuid(),
    resource_type: z.string(),
    media_type: z.string().nullable(),
    mime_type: z.string().nullable(),
    file_size: z.number().int().nonnegative().nullable(),
    sort_order: z.number().int(),
    caption: z.string().nullable().optional(),
    public_url: z.string().url().nullable(),
    created_at: isoTimestamp,
    updated_at: isoTimestamp.nullable().optional(),
  })
  .strict();

const projectExportSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string().nullable(),
    title: z.string(),
    tagline: z.string().nullable(),
    description: z.string().nullable(),
    technologies: z.array(z.string()),
    is_published: z.boolean(),
    sort_order: z.number().int(),
    user_role: z.string().nullable(),
    status: z.string().nullable(),
    started_at: z.string().nullable(),
    ended_at: z.string().nullable(),
    case_study_sections: z.unknown(),
    created_at: isoTimestamp,
    updated_at: isoTimestamp,
    domains: z.array(
      z
        .object({
          id: z.string().uuid(),
          name: z.string(),
          created_at: isoTimestamp,
        })
        .strict(),
    ),
    focus_areas: z.array(
      z
        .object({
          id: z.string().uuid(),
          name: z.string(),
          created_at: isoTimestamp,
        })
        .strict(),
    ),
    links: z.array(
      z
        .object({
          id: z.string().uuid(),
          type: z.string(),
          label: z.string().nullable(),
          url: z.string(),
          sort_order: z.number().int(),
          created_at: isoTimestamp,
          updated_at: isoTimestamp,
        })
        .strict(),
    ),
    media: z.array(mediaMetadataSchema),
    ordering: z
      .object({
        id: z.string().uuid(),
        sort_order: z.number().int(),
        created_at: isoTimestamp,
      })
      .strict()
      .nullable(),
  })
  .strict();

const researchExportSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    title: z.string(),
    abstract: z.string().nullable(),
    authors: z.array(z.string()),
    venue: z.string().nullable(),
    publication_status: z.string().nullable(),
    year: z.number().int().nullable(),
    pdf_url: z.string().nullable(),
    doi_url: z.string().nullable(),
    citation_text: z.string().nullable(),
    tags: z.array(z.string()),
    cover_image_public_url: z.string().url().nullable(),
    is_published: z.boolean(),
    sort_order: z.number().int(),
    related_project_id: z.string().uuid().nullable(),
    created_at: isoTimestamp,
    updated_at: isoTimestamp,
    figures: z.array(
      z
        .object({
          id: z.string().uuid(),
          caption: z.string().nullable(),
          sort_order: z.number().int(),
          public_url: z.string().url().nullable(),
          created_at: isoTimestamp,
          updated_at: isoTimestamp,
        })
        .strict(),
    ),
  })
  .strict();

const trafficSourceSchema = z
  .object({
    label: z.string(),
    value: z.number().int().nonnegative(),
    pct: z.number(),
  })
  .strict();

const trendTotalsSchema = z
  .object({
    profileViews: z.number().int().nonnegative(),
    projectViews: z.number().int().nonnegative(),
    linkClicks: z.number().int().nonnegative(),
    profileShares: z.number().int().nonnegative(),
    qrDownloads: z.number().int().nonnegative(),
  })
  .strict();

const analyticsSummarySchema = z
  .object({
    profile_id: z.string().uuid(),
    profile_slug: z.string(),
    display_name: z.string(),
    is_public: z.boolean(),
    has_any_events: z.boolean(),
    totals: z
      .object({
        profileViews: z.number().int().nonnegative(),
        projectViews: z.number().int().nonnegative(),
        linkClicks: z.number().int().nonnegative(),
        profileShares: z.number().int().nonnegative(),
        qrDownloads: z.number().int().nonnegative(),
        researchViews: z.number().int().nonnegative(),
        pdfDownloads: z.number().int().nonnegative(),
        citationCopies: z.number().int().nonnegative(),
        projectTimeSpentSec: z.number().int().nonnegative(),
        researchTimeSpentSec: z.number().int().nonnegative(),
      })
      .strict(),
    sources: z.array(trafficSourceSchema),
    top_projects: z.array(
      z
        .object({
          id: z.string().uuid(),
          title: z.string(),
          views: z.number().int().nonnegative(),
          link_clicks: z.number().int().nonnegative(),
          time_spent_sec: z.number().int().nonnegative(),
          poster_public_url: z.string().url().nullable(),
        })
        .strict(),
    ),
    top_research: z.array(
      z
        .object({
          id: z.string().uuid(),
          title: z.string(),
          views: z.number().int().nonnegative(),
          pdf_downloads: z.number().int().nonnegative(),
          citation_copies: z.number().int().nonnegative(),
          time_spent_sec: z.number().int().nonnegative(),
          avg_read_time_sec: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    trends_7d: z
      .object({
        start_day: z.string(),
        end_day: z.string(),
        totals: trendTotalsSchema,
      })
      .strict()
      .nullable(),
    trends_30d: z
      .object({
        start_day: z.string(),
        end_day: z.string(),
        totals: trendTotalsSchema,
      })
      .strict()
      .nullable(),
    retention_note: z.string(),
  })
  .strict();

const additionalAccountDataSchema = z
  .object({
    saved_connections: z.array(
      z
        .object({
          id: z.string().uuid(),
          saved_profile_id: z.string().uuid(),
          connected_at: isoTimestamp.nullable(),
          met_at: isoTimestamp.nullable(),
          source: z.string(),
          context: z.string().nullable().optional(),
          created_at: isoTimestamp,
          updated_at: isoTimestamp,
        })
        .strict(),
    ),
    connection_notes: z.array(
      z
        .object({
          id: z.string().uuid(),
          saved_connection_id: z.string().uuid(),
          body: z.string(),
          created_at: isoTimestamp,
          updated_at: isoTimestamp,
        })
        .strict(),
    ),
    collections: z.array(
      z
        .object({
          id: z.string().uuid(),
          name: z.string(),
          description: z.string().nullable(),
          created_at: isoTimestamp,
          updated_at: isoTimestamp,
          items: z.array(
            z
              .object({
                id: z.string().uuid(),
                saved_connection_id: z.string().uuid(),
                sort_order: z.number().int(),
                created_at: isoTimestamp,
              })
              .strict(),
          ),
        })
        .strict(),
    ),
    subscription: z
      .object({
        plan_label: z.string(),
        status: z.string(),
        current_period_start: isoTimestamp.nullable(),
        current_period_end: isoTimestamp.nullable(),
        cancel_at_period_end: z.boolean(),
        created_at: isoTimestamp,
        updated_at: isoTimestamp,
      })
      .strict()
      .nullable(),
    moderation_reports: z.array(
      z
        .object({
          id: z.string().uuid(),
          target_type: z.string(),
          target_id: z.string().uuid(),
          reason: z.string(),
          status: z.string(),
          created_at: isoTimestamp,
          updated_at: isoTimestamp,
        })
        .strict(),
    ),
    circle_activity: z.array(
      z
        .object({
          id: z.string().uuid(),
          event_type: z.string(),
          target_type: z.string(),
          target_id: z.string().uuid(),
          dedupe_key: z.string(),
          created_at: isoTimestamp,
        })
        .strict(),
    ),
    circle_viewer_state: z
      .object({
        last_seen_at: isoTimestamp.nullable(),
      })
      .strict()
      .nullable(),
  })
  .strict();

export const accountExportDocumentSchema = z
  .object({
    schema_version: z.literal(ACCOUNT_EXPORT_SCHEMA_VERSION),
    generated_at: isoTimestamp,
    account: z
      .object({
        user_id: z.string().uuid(),
        email: z.string().email().nullable(),
        created_at: isoTimestamp.nullable(),
        last_sign_in_at: isoTimestamp.nullable(),
        providers: z.array(z.string()),
      })
      .strict(),
    profile: z
      .object({
        id: z.string().uuid(),
        slug: z.string(),
        display_name: z.string(),
        headline: z.string().nullable(),
        bio: z.string().nullable(),
        location: z.string().nullable(),
        skills: z.array(z.string()),
        is_public: z.boolean(),
        avatar_public_url: z.string().url().nullable(),
        created_at: isoTimestamp,
        updated_at: isoTimestamp,
      })
      .strict()
      .nullable(),
    profile_links: z.array(
      z
        .object({
          id: z.string().uuid(),
          type: z.string(),
          label: z.string().nullable(),
          url: z.string(),
          sort_order: z.number().int(),
          created_at: isoTimestamp,
          updated_at: isoTimestamp,
        })
        .strict(),
    ),
    projects: z.array(projectExportSchema),
    research: z.array(researchExportSchema),
    analytics_summary: analyticsSummarySchema.nullable(),
    additional_account_data: additionalAccountDataSchema,
    export_notes: z.array(z.string()),
  })
  .strict();

export type AccountExportDocument = z.infer<typeof accountExportDocumentSchema>;
export type AccountExportProject = z.infer<typeof projectExportSchema>;
export type AccountExportResearch = z.infer<typeof researchExportSchema>;
export type AccountExportAnalyticsSummary = z.infer<typeof analyticsSummarySchema>;

/** Forbidden keys that must never appear in serialized export JSON. */
export const FORBIDDEN_EXPORT_FIELD_NAMES = [
  'password',
  'password_hash',
  'access_token',
  'refresh_token',
  'service_role',
  'stripe_customer_id',
  'stripe_subscription_id',
  'stripe_price_id',
  'sk_live',
  'sk_test',
  'whsec_',
  'storage_path',
  'session_id',
  'ip_address',
  'user_agent',
] as const;

export function buildAccountExportFilename(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `codecard-account-export-${y}-${m}-${d}.json`;
}

export function toUtcIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function isStablePublicHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (parsed.username || parsed.password) return null;
    const lower = value.toLowerCase();
    if (lower.includes('token=') || lower.includes('signature=') || lower.includes('x-amz-')) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Deep scan for forbidden secret field names in an export document. */
export function findForbiddenExportFields(value: unknown, path = ''): string[] {
  const hits: string[] = [];
  if (value == null) return hits;
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      hits.push(...findForbiddenExportFields(item, `${path}[${index}]`));
    });
    return hits;
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const next = path ? `${path}.${key}` : key;
      const lower = key.toLowerCase();
      for (const forbidden of FORBIDDEN_EXPORT_FIELD_NAMES) {
        if (lower === forbidden || lower.includes(forbidden)) {
          hits.push(next);
        }
      }
      hits.push(...findForbiddenExportFields(child, next));
    }
  }
  return hits;
}
