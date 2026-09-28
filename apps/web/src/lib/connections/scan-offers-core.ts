import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CONNECTION_CREATE_SOURCE,
  CONNECTIONS_TABLE,
} from '@/lib/connections/connections-contract';
import {
  getAuthenticatedUser,
  resolveOwnedProfile,
  type AuthUser,
} from '@/lib/profile/profile-auth-core';

export const SCAN_OFFERS_TABLE = 'connection_scan_offers' as const;

export type ScanOfferStatus = 'pending' | 'accepted' | 'dismissed';

export type ScanOfferCard = {
  id: string;
  scannerProfileId: string;
  scannerName: string;
  scannerHeadline: string | null;
  scannerSlug: string | null;
  scannerAvatarUrl: string | null;
  createdAt: string;
};

export type ScanOfferMutationState = {
  success?: boolean;
  error?: string;
  code?: 'UNAUTHENTICATED' | 'NOT_FOUND' | 'TEMPORARY_FAILURE';
  connectionId?: string;
};

const TARGET_SELECT =
  'id, slug, display_name, headline, avatar_url, is_public, owner_user_id, tenant_id';

export async function notifyCardOwnerOfScan(
  supabase: SupabaseClient,
  input: {
    scannerUserId: string;
    scannerProfileId: string;
    scannedUserId: string;
    scannedProfileId: string;
    scannedTenantId: string;
  },
): Promise<void> {
  try {
    if (
      !input.scannerUserId ||
      !input.scannedUserId ||
      input.scannerUserId === input.scannedUserId
    ) {
      return;
    }

  const { data: existing } = await supabase
    .from(SCAN_OFFERS_TABLE)
    .select('id, status')
    .eq('scanned_user_id', input.scannedUserId)
    .eq('scanner_user_id', input.scannerUserId)
    .maybeSingle();

  if (existing?.status === 'accepted') return;

  if (existing?.id) {
    await supabase
      .from(SCAN_OFFERS_TABLE)
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .eq('scanned_user_id', input.scannedUserId);
    return;
  }

  await supabase.from(SCAN_OFFERS_TABLE).insert({
    tenant_id: input.scannedTenantId,
    scanner_user_id: input.scannerUserId,
    scanner_profile_id: input.scannerProfileId,
    scanned_user_id: input.scannedUserId,
    scanned_profile_id: input.scannedProfileId,
    status: 'pending',
  });
  } catch {
    return;
  }
}

export async function listPendingScanOffers(
  supabase: SupabaseClient,
  options?: { user?: AuthUser | null },
): Promise<{ offers: ScanOfferCard[]; error?: string }> {
  const user = await getAuthenticatedUser(supabase, options);
  if (!user) return { offers: [], error: 'UNAUTHENTICATED' };

  const { data, error } = await supabase
    .from(SCAN_OFFERS_TABLE)
    .select('id, scanner_profile_id, created_at')
    .eq('scanned_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return { offers: [], error: 'TEMPORARY_FAILURE' };
  const rows = data ?? [];
  if (rows.length === 0) return { offers: [] };

  const profileIds = rows.map((row) => row.scanner_profile_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, slug, display_name, headline, avatar_url')
    .in('id', profileIds);

  const byId = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return {
    offers: rows.map((row) => {
      const profile = byId.get(row.scanner_profile_id);
      return {
        id: row.id,
        scannerProfileId: row.scanner_profile_id,
        scannerName: profile?.display_name?.trim() || 'Someone',
        scannerHeadline: profile?.headline ?? null,
        scannerSlug: profile?.slug ?? null,
        scannerAvatarUrl: profile?.avatar_url ?? null,
        createdAt: row.created_at,
      };
    }),
  };
}

export async function executeAcceptScanOffer(
  supabase: SupabaseClient,
  offerId: string,
  options?: { user?: AuthUser | null },
): Promise<ScanOfferMutationState> {
  const user = await getAuthenticatedUser(supabase, options);
  if (!user) return { error: 'Sign in to add this Connection.', code: 'UNAUTHENTICATED' };

  const owned = await resolveOwnedProfile(supabase, user);
  if ('error' in owned) {
    return { error: 'Sign in to add this Connection.', code: 'UNAUTHENTICATED' };
  }

  const { data: offer } = await supabase
    .from(SCAN_OFFERS_TABLE)
    .select('id, scanner_profile_id, status')
    .eq('id', offerId)
    .eq('scanned_user_id', user.id)
    .maybeSingle();

  if (!offer || offer.status !== 'pending') {
    return { error: 'That scan is no longer waiting.', code: 'NOT_FOUND' };
  }

  const { data: scanner } = await supabase
    .from('profiles')
    .select(TARGET_SELECT)
    .eq('id', offer.scanner_profile_id)
    .maybeSingle();

  if (!scanner) {
    return { error: 'That CodeCard is no longer available.', code: 'NOT_FOUND' };
  }

  const { data: existing } = await supabase
    .from(CONNECTIONS_TABLE)
    .select('id')
    .eq('owner_user_id', user.id)
    .eq('saved_profile_id', scanner.id)
    .maybeSingle();

  let connectionId = existing?.id ?? null;
  if (!connectionId) {
    const now = new Date().toISOString();
    const { data: inserted, error: insertError } = await supabase
      .from(CONNECTIONS_TABLE)
      .insert({
        tenant_id: owned.profile.tenant_id,
        owner_user_id: user.id,
        saved_profile_id: scanner.id,
        source: CONNECTION_CREATE_SOURCE,
        connected_at: now,
        met_at: now,
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      return { error: 'Could not add this Connection.', code: 'TEMPORARY_FAILURE' };
    }
    connectionId = inserted.id;
  }

  const { error: updateError } = await supabase
    .from(SCAN_OFFERS_TABLE)
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', offer.id)
    .eq('scanned_user_id', user.id);

  if (updateError) {
    return { error: 'Could not add this Connection.', code: 'TEMPORARY_FAILURE' };
  }

  return { success: true, connectionId };
}

export async function executeDismissScanOffer(
  supabase: SupabaseClient,
  offerId: string,
  options?: { user?: AuthUser | null },
): Promise<ScanOfferMutationState> {
  const user = await getAuthenticatedUser(supabase, options);
  if (!user) return { error: 'Sign in first.', code: 'UNAUTHENTICATED' };

  const { data: offer } = await supabase
    .from(SCAN_OFFERS_TABLE)
    .select('id, status')
    .eq('id', offerId)
    .eq('scanned_user_id', user.id)
    .maybeSingle();

  if (!offer || offer.status !== 'pending') {
    return { error: 'That scan is no longer waiting.', code: 'NOT_FOUND' };
  }

  const { error } = await supabase
    .from(SCAN_OFFERS_TABLE)
    .update({ status: 'dismissed', updated_at: new Date().toISOString() })
    .eq('id', offer.id)
    .eq('scanned_user_id', user.id);

  if (error) return { error: 'Could not dismiss this scan.', code: 'TEMPORARY_FAILURE' };
  return { success: true };
}
