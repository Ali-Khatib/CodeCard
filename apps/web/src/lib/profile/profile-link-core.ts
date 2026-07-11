import {
  findDuplicateProfileLink,
  PROFILE_LINKS_MAX_COUNT,
  profileLinkInputSchema,
  reorderProfileLinksSchema,
} from '@codecard/validation';
import type { ProfileLink } from '@codecard/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getAuthenticatedUser,
  resolveOwnedProfile,
  type AuthUser,
} from '@/lib/profile/profile-auth-core';

export type ProfileLinkRow = Pick<
  ProfileLink,
  'id' | 'type' | 'label' | 'url' | 'sort_order'
>;

export type ProfileLinkFieldErrors = Partial<Record<'type' | 'label' | 'url', string>>;

export type ProfileLinkMutationState = {
  success?: boolean;
  error?: string;
  fieldErrors?: ProfileLinkFieldErrors;
  link?: ProfileLinkRow;
};

const DUPLICATE_LINK_MESSAGE = 'This link already exists on your profile.';

export function mapProfileLinkDbError(): ProfileLinkMutationState {
  return { error: 'Could not save your profile link. Please try again.' };
}

async function loadOwnedProfileLinks(
  supabase: SupabaseClient,
  profileId: string,
): Promise<ProfileLinkRow[]> {
  const { data } = await supabase
    .from('profile_links')
    .select('id, type, label, url, sort_order')
    .eq('profile_id', profileId)
    .order('sort_order', { ascending: true });

  return (data ?? []) as ProfileLinkRow[];
}

async function verifyOwnedLink(
  supabase: SupabaseClient,
  profileId: string,
  linkId: string,
): Promise<ProfileLinkRow | null> {
  const { data } = await supabase
    .from('profile_links')
    .select('id, type, label, url, sort_order')
    .eq('profile_id', profileId)
    .eq('id', linkId)
    .maybeSingle();

  return (data as ProfileLinkRow | null) ?? null;
}

function validationFailure(error: { path: (string | number)[]; message: string }): ProfileLinkMutationState {
  const field = error.path[0];
  if (typeof field === 'string') {
    return {
      error: error.message,
      fieldErrors: { [field]: error.message } as ProfileLinkFieldErrors,
    };
  }
  return { error: error.message };
}

export async function executeCreateProfileLink(
  supabase: SupabaseClient,
  formData: FormData,
  options?: { user?: AuthUser | null },
): Promise<ProfileLinkMutationState> {
  const user = await getAuthenticatedUser(supabase, options);
  const resolved = await resolveOwnedProfile(supabase, user);
  if ('error' in resolved) return { error: resolved.error };

  const parsed = profileLinkInputSchema.safeParse({
    type: String(formData.get('type') ?? ''),
    label: String(formData.get('label') ?? '') || null,
    url: String(formData.get('url') ?? ''),
  });
  if (!parsed.success) {
    return validationFailure(parsed.error.errors[0]!);
  }

  const existing = await loadOwnedProfileLinks(supabase, resolved.profile.id);
  if (existing.length >= PROFILE_LINKS_MAX_COUNT) {
    return { error: `You can add at most ${PROFILE_LINKS_MAX_COUNT} profile links.` };
  }
  if (findDuplicateProfileLink(existing, parsed.data)) {
    return { error: DUPLICATE_LINK_MESSAGE, fieldErrors: { url: DUPLICATE_LINK_MESSAGE } };
  }

  const nextSortOrder =
    existing.length === 0 ? 0 : Math.max(...existing.map((link) => link.sort_order)) + 1;

  const { data, error } = await supabase
    .from('profile_links')
    .insert({
      tenant_id: resolved.profile.tenant_id,
      profile_id: resolved.profile.id,
      type: parsed.data.type,
      label: parsed.data.label,
      url: parsed.data.url,
      sort_order: nextSortOrder,
    })
    .select('id, type, label, url, sort_order')
    .single();

  if (error || !data) {
    return mapProfileLinkDbError();
  }

  return { success: true, link: data as ProfileLinkRow };
}

export async function executeUpdateProfileLink(
  supabase: SupabaseClient,
  formData: FormData,
  options?: { user?: AuthUser | null },
): Promise<ProfileLinkMutationState> {
  const user = await getAuthenticatedUser(supabase, options);
  const resolved = await resolveOwnedProfile(supabase, user);
  if ('error' in resolved) return { error: resolved.error };

  const linkId = String(formData.get('link_id') ?? '');
  if (!linkId) {
    return { error: 'Profile link not found.' };
  }

  const owned = await verifyOwnedLink(supabase, resolved.profile.id, linkId);
  if (!owned) {
    return { error: 'Profile link not found.' };
  }

  const parsed = profileLinkInputSchema.safeParse({
    type: String(formData.get('type') ?? ''),
    label: String(formData.get('label') ?? '') || null,
    url: String(formData.get('url') ?? ''),
  });
  if (!parsed.success) {
    return validationFailure(parsed.error.errors[0]!);
  }

  const existing = await loadOwnedProfileLinks(supabase, resolved.profile.id);
  if (findDuplicateProfileLink(existing, { ...parsed.data, id: linkId })) {
    return { error: DUPLICATE_LINK_MESSAGE, fieldErrors: { url: DUPLICATE_LINK_MESSAGE } };
  }

  const { data, error } = await supabase
    .from('profile_links')
    .update({
      type: parsed.data.type,
      label: parsed.data.label,
      url: parsed.data.url,
    })
    .eq('id', linkId)
    .eq('profile_id', resolved.profile.id)
    .select('id, type, label, url, sort_order')
    .single();

  if (error || !data) {
    return mapProfileLinkDbError();
  }

  return { success: true, link: data as ProfileLinkRow };
}

export async function executeDeleteProfileLink(
  supabase: SupabaseClient,
  linkId: string,
  options?: { user?: AuthUser | null },
): Promise<ProfileLinkMutationState> {
  const user = await getAuthenticatedUser(supabase, options);
  const resolved = await resolveOwnedProfile(supabase, user);
  if ('error' in resolved) return { error: resolved.error };

  const owned = await verifyOwnedLink(supabase, resolved.profile.id, linkId);
  if (!owned) {
    return { error: 'Profile link not found.' };
  }

  const { error } = await supabase
    .from('profile_links')
    .delete()
    .eq('id', linkId)
    .eq('profile_id', resolved.profile.id);

  if (error) {
    return mapProfileLinkDbError();
  }

  const remaining = (await loadOwnedProfileLinks(supabase, resolved.profile.id)).filter(
    (link) => link.id !== linkId,
  );
  await persistProfileLinkOrder(supabase, resolved.profile.id, remaining.map((link) => link.id));

  return { success: true };
}

export async function executeReorderProfileLinks(
  supabase: SupabaseClient,
  linkIds: string[],
  options?: { user?: AuthUser | null },
): Promise<ProfileLinkMutationState> {
  const user = await getAuthenticatedUser(supabase, options);
  const resolved = await resolveOwnedProfile(supabase, user);
  if ('error' in resolved) return { error: resolved.error };

  const parsed = reorderProfileLinksSchema.safeParse({ link_ids: linkIds });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid link order.' };
  }

  const existing = await loadOwnedProfileLinks(supabase, resolved.profile.id);
  const ownedIds = new Set(existing.map((link) => link.id));

  if (parsed.data.link_ids.length !== existing.length) {
    return { error: 'Could not reorder profile links.' };
  }

  const unique = new Set(parsed.data.link_ids);
  if (unique.size !== parsed.data.link_ids.length) {
    return { error: 'Could not reorder profile links.' };
  }

  for (const id of parsed.data.link_ids) {
    if (!ownedIds.has(id)) {
      return { error: 'Could not reorder profile links.' };
    }
  }

  await persistProfileLinkOrder(supabase, resolved.profile.id, parsed.data.link_ids);
  return { success: true };
}

async function persistProfileLinkOrder(
  supabase: SupabaseClient,
  profileId: string,
  orderedIds: string[],
) {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from('profile_links')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('profile_id', profileId),
    ),
  );
}

export async function executeMoveProfileLink(
  supabase: SupabaseClient,
  linkId: string,
  direction: 'up' | 'down',
  options?: { user?: AuthUser | null },
): Promise<ProfileLinkMutationState> {
  const user = await getAuthenticatedUser(supabase, options);
  const resolved = await resolveOwnedProfile(supabase, user);
  if ('error' in resolved) return { error: resolved.error };

  const links = await loadOwnedProfileLinks(supabase, resolved.profile.id);
  const index = links.findIndex((link) => link.id === linkId);
  if (index < 0) {
    return { error: 'Profile link not found.' };
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= links.length) {
    return { success: true };
  }

  const reordered = [...links];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(targetIndex, 0, moved);

  return executeReorderProfileLinks(
    supabase,
    reordered.map((link) => link.id),
    { user },
  );
}
