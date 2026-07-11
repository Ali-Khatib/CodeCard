import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveOwnedProfile } from '@/lib/profile/profile-auth-core';
import type { StorageResourceType } from '@/lib/storage/path';

export type UploadOwnershipContext = {
  tenantId: string;
  ownerUserId: string;
  resourceType: StorageResourceType;
  resourceId: string;
};

export type UploadOwnershipResult =
  | { ok: true; ownership: UploadOwnershipContext }
  | { ok: false; status: 403 | 400; message: string };

export async function resolveUploadOwnership(
  supabase: SupabaseClient,
  userId: string,
  resourceType: StorageResourceType,
  resourceId?: string,
): Promise<UploadOwnershipResult> {
  if (resourceType === 'avatar') {
    const resolved = await resolveOwnedProfile(supabase, { id: userId });
    if ('error' in resolved) {
      return { ok: false, status: 403, message: 'You do not have permission to upload this file.' };
    }

    return {
      ok: true,
      ownership: {
        tenantId: resolved.profile.tenant_id,
        ownerUserId: userId,
        resourceType,
        resourceId: resolved.profile.id,
      },
    };
  }

  if (!resourceId) {
    return { ok: false, status: 400, message: 'Resource ID is required.' };
  }

  if (resourceType === 'project-media') {
    const { data: project } = await supabase
      .from('projects')
      .select('id, tenant_id, owner_user_id')
      .eq('id', resourceId)
      .eq('owner_user_id', userId)
      .maybeSingle();

    if (!project) {
      return { ok: false, status: 403, message: 'You do not have permission to upload this file.' };
    }

    return {
      ok: true,
      ownership: {
        tenantId: project.tenant_id,
        ownerUserId: userId,
        resourceType,
        resourceId: project.id,
      },
    };
  }

  const { data: paper } = await supabase
    .from('research_papers')
    .select('id, tenant_id, owner_user_id')
    .eq('id', resourceId)
    .eq('owner_user_id', userId)
    .maybeSingle();

  if (!paper) {
    return { ok: false, status: 403, message: 'You do not have permission to upload this file.' };
  }

  return {
    ok: true,
    ownership: {
      tenantId: paper.tenant_id,
      ownerUserId: userId,
      resourceType,
      resourceId: paper.id,
    },
  };
}
