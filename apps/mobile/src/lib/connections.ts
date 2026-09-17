import { addConnectionInputSchema } from '@codecard/validation';
import type { SupabaseClient } from '@supabase/supabase-js';

export const CONNECTIONS_TABLE = 'saved_connections' as const;
export const CONNECTION_CREATE_SOURCE = 'qr' as const;

export type SavedConnectionInsert = {
  tenant_id: string;
  owner_user_id: string;
  saved_profile_id: string;
  source: typeof CONNECTION_CREATE_SOURCE;
  connected_at: string;
};

export type OwnerConnection = {
  id: string;
  source: string;
  connectedAt: string | null;
  createdAt: string;
  profileId: string;
  slug: string | null;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
};

export type PublicTargetProfile = {
  id: string;
  tenant_id: string;
  owner_user_id: string;
  slug: string;
  display_name: string;
  headline: string | null;
  avatar_url: string | null;
  is_public: boolean;
};

export function buildSavedConnectionInsert(input: {
  tenantId: string;
  ownerUserId: string;
  savedProfileId: string;
  connectedAt?: string;
}): SavedConnectionInsert {
  return {
    tenant_id: input.tenantId,
    owner_user_id: input.ownerUserId,
    saved_profile_id: input.savedProfileId,
    source: CONNECTION_CREATE_SOURCE,
    connected_at: input.connectedAt ?? new Date().toISOString(),
  };
}

type ProfileEmbed = {
  id: string;
  slug: string | null;
  display_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  is_public: boolean | null;
};

export async function listOwnerConnections(
  supabase: SupabaseClient,
  ownerUserId: string,
): Promise<{ ok: true; connections: OwnerConnection[] } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from(CONNECTIONS_TABLE)
    .select(
      'id, source, connected_at, created_at, saved_profile_id, profile:saved_profile_id(id, slug, display_name, headline, avatar_url, is_public)',
    )
    .eq('owner_user_id', ownerUserId)
    .order('created_at', { ascending: false });

  if (error) return { ok: false, error: error.message };

  const connections: OwnerConnection[] = (data ?? []).map((row) => {
    const embedded = row.profile as ProfileEmbed | ProfileEmbed[] | null;
    const profile = Array.isArray(embedded) ? embedded[0] : embedded;
    return {
      id: row.id as string,
      source: String(row.source ?? CONNECTION_CREATE_SOURCE),
      connectedAt: (row.connected_at as string | null) ?? null,
      createdAt: String(row.created_at ?? ''),
      profileId: String(row.saved_profile_id),
      slug: profile?.slug ?? null,
      displayName: profile?.display_name ?? 'Unknown',
      headline: profile?.headline ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      isPublic: Boolean(profile?.is_public),
    };
  });

  return { ok: true, connections };
}

export async function loadPublicProfileBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<{ ok: true; profile: PublicTargetProfile } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, tenant_id, owner_user_id, slug, display_name, headline, avatar_url, is_public')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'This CodeCard is not public.' };
  return { ok: true, profile: data as PublicTargetProfile };
}

export async function connectFromQrScan(
  supabase: SupabaseClient,
  input: {
    ownerUserId: string;
    ownerTenantId: string;
    ownerProfileId: string;
    target: PublicTargetProfile;
  },
): Promise<
  | { ok: true; alreadyConnected: boolean }
  | { ok: false; error: string }
> {
  const parsed = addConnectionInputSchema.safeParse({
    targetProfileId: input.target.id,
    targetSlug: input.target.slug,
    source: CONNECTION_CREATE_SOURCE,
  });
  if (!parsed.success) {
    return { ok: false, error: 'Could not save this connection.' };
  }

  if (input.target.id === input.ownerProfileId) {
    return { ok: false, error: 'You cannot connect to your own CodeCard.' };
  }

  const { data: existing, error: existingError } = await supabase
    .from(CONNECTIONS_TABLE)
    .select('id')
    .eq('owner_user_id', input.ownerUserId)
    .eq('saved_profile_id', input.target.id)
    .maybeSingle();

  if (existingError) return { ok: false, error: existingError.message };
  if (existing) return { ok: true, alreadyConnected: true };

  const row = buildSavedConnectionInsert({
    tenantId: input.ownerTenantId,
    ownerUserId: input.ownerUserId,
    savedProfileId: input.target.id,
  });

  const { error: insertError } = await supabase.from(CONNECTIONS_TABLE).insert(row);
  if (insertError) {
    if (insertError.code === '23505') return { ok: true, alreadyConnected: true };
    return { ok: false, error: insertError.message };
  }

  return { ok: true, alreadyConnected: false };
}
