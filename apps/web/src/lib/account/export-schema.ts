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
    projects: z.array(z.unknown()),
    research: z.array(z.unknown()),
    analytics_summary: z.unknown().nullable(),
    additional_account_data: z
      .object({
        saved_connections: z.array(z.unknown()),
        connection_notes: z.array(z.unknown()),
        collections: z.array(z.unknown()),
        subscription: z.unknown().nullable(),
        moderation_reports: z.array(z.unknown()),
      })
      .strict(),
    export_notes: z.array(z.string()),
  })
  .strict();

export type AccountExportDocument = z.infer<typeof accountExportDocumentSchema>;

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
