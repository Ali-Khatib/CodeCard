import { revalidatePath } from 'next/cache';
import { apiError } from '@/lib/api-utils';
import {
  ownedMutationJson,
  readOwnedFormPost,
} from '@/lib/dashboard/owned-form-request';
import {
  executeCreateProfileLink,
  executeDeleteProfileLink,
  executeMoveProfileLink,
  executeUpdateProfileLink,
  type ProfileLinkMutationState,
} from '@/lib/profile/profile-link-core';
import { resolveOwnedProfile } from '@/lib/profile/profile-auth-core';
import { revalidatePublicProfile } from '@/lib/profile/public-cache';

export const dynamic = 'force-dynamic';

const OPS = new Set(['create', 'update', 'delete', 'move']);

function clientBody(result: ProfileLinkMutationState) {
  return {
    success: Boolean(result.success),
    error: result.error,
    fieldErrors: result.fieldErrors,
    link: result.link,
  };
}

async function revalidateAfterLinkWrite(
  supabase: Parameters<typeof resolveOwnedProfile>[0],
  user: { id: string },
) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/profile');
  revalidatePath('/dashboard/profile/preview');
  const resolved = await resolveOwnedProfile(supabase, user);
  if (!('error' in resolved) && resolved.profile.slug) {
    revalidatePublicProfile(resolved.profile.slug);
  }
}

/**
 * Add, edit, delete, or reorder a profile link without rendering Home.
 * The editor applies the returned link locally.
 */
export async function POST(request: Request) {
  const opened = await readOwnedFormPost(request, 16 * 1024);
  if (!opened.ok) return opened.response;

  const op = new URL(request.url).searchParams.get('op');
  if (!op || !OPS.has(op)) {
    return apiError('Unknown link action.', 400);
  }

  const { supabase, user, formData } = opened;
  const auth = { user };
  let result: ProfileLinkMutationState;

  if (op === 'create') {
    result = await executeCreateProfileLink(supabase, formData, auth);
  } else if (op === 'update') {
    result = await executeUpdateProfileLink(supabase, formData, auth);
  } else if (op === 'delete') {
    const linkId = String(formData.get('link_id') ?? '');
    result = await executeDeleteProfileLink(supabase, linkId, auth);
  } else {
    const linkId = String(formData.get('link_id') ?? '');
    const direction = String(formData.get('direction') ?? '');
    if (direction !== 'up' && direction !== 'down') {
      return apiError('Unknown link action.', 400);
    }
    result = await executeMoveProfileLink(supabase, linkId, direction, auth);
  }

  if (result.success) {
    await revalidateAfterLinkWrite(supabase, user);
  }

  return ownedMutationJson(clientBody(result), result.success ? 200 : 400);
}

export async function GET() {
  return apiError('Method not allowed', 405);
}
