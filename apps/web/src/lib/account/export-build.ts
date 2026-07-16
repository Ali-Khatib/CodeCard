import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  ACCOUNT_EXPORT_SCHEMA_VERSION,
  accountExportDocumentSchema,
  isStablePublicHttpUrl,
  toUtcIso,
  type AccountExportDocument,
} from '@/lib/account/export-schema';

export type BuildAccountExportResult =
  | { ok: true; document: AccountExportDocument }
  | { ok: false; error: 'query_failed' | 'validation_failed' };

function providersFromUser(user: User): string[] {
  const identities = user.identities ?? [];
  const names = identities
    .map((identity) => identity.provider)
    .filter((provider): provider is string => Boolean(provider));
  return [...new Set(names)].sort();
}

/**
 * Build the WS10 account export document for the authenticated user.
 * Ownership is always `user.id` from the session — never client-supplied.
 *
 * T002 ships account + profile + links with empty remaining sections.
 * T003 fills projects, research, analytics, and additional owner data.
 */
export async function buildAccountExportDocument(
  supabase: SupabaseClient,
  user: User,
): Promise<BuildAccountExportResult> {
  const generatedAt = new Date().toISOString();
  const exportNotes = [
    'Technical export per docs/account-data-inventory.md — legal review pending.',
    'Raw analytics events are not included; analytics_summary uses owner aggregates when available.',
    'Stripe customer/subscription identifiers and payment methods are not included.',
    'Signed storage URLs and storage object paths are not included.',
    'ZIP/binary file bundles are not supported; JSON metadata only.',
  ];

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(
      'id, slug, display_name, headline, bio, location, skills, is_public, avatar_url, created_at, updated_at',
    )
    .eq('owner_user_id', user.id)
    .maybeSingle();

  if (profileError) {
    return { ok: false, error: 'query_failed' };
  }

  let profileLinks: AccountExportDocument['profile_links'] = [];
  if (profile) {
    const { data: links, error: linksError } = await supabase
      .from('profile_links')
      .select('id, type, label, url, sort_order, created_at, updated_at')
      .eq('profile_id', profile.id)
      .order('sort_order', { ascending: true });

    if (linksError) {
      return { ok: false, error: 'query_failed' };
    }

    profileLinks = (links ?? []).map((link) => ({
      id: link.id,
      type: link.type,
      label: link.label ?? null,
      url: link.url,
      sort_order: link.sort_order,
      created_at: toUtcIso(link.created_at) ?? generatedAt,
      updated_at: toUtcIso(link.updated_at) ?? generatedAt,
    }));
  } else {
    exportNotes.push('No profile row exists for this account yet.');
  }

  const document: AccountExportDocument = {
    schema_version: ACCOUNT_EXPORT_SCHEMA_VERSION,
    generated_at: generatedAt,
    account: {
      user_id: user.id,
      email: user.email ?? null,
      created_at: toUtcIso(user.created_at),
      last_sign_in_at: toUtcIso(user.last_sign_in_at),
      providers: providersFromUser(user),
    },
    profile: profile
      ? {
          id: profile.id,
          slug: profile.slug,
          display_name: profile.display_name,
          headline: profile.headline ?? null,
          bio: profile.bio ?? null,
          location: profile.location ?? null,
          skills: Array.isArray(profile.skills) ? profile.skills : [],
          is_public: Boolean(profile.is_public),
          avatar_public_url: isStablePublicHttpUrl(profile.avatar_url),
          created_at: toUtcIso(profile.created_at) ?? generatedAt,
          updated_at: toUtcIso(profile.updated_at) ?? generatedAt,
        }
      : null,
    profile_links: profileLinks,
    projects: [],
    research: [],
    analytics_summary: null,
    additional_account_data: {
      saved_connections: [],
      connection_notes: [],
      collections: [],
      subscription: null,
      moderation_reports: [],
    },
    export_notes: exportNotes,
  };

  if (!document.analytics_summary) {
    exportNotes.push(
      'analytics_summary is null until WS10-T003 populates owner aggregates for this account.',
    );
  }

  const validated = accountExportDocumentSchema.safeParse(document);
  if (!validated.success) {
    return { ok: false, error: 'validation_failed' };
  }

  return { ok: true, document: validated.data };
}
