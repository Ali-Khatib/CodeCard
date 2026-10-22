import { apiError } from '@/lib/api-utils';
import {
  ownedMutationJson,
  readOwnedFormPost,
} from '@/lib/dashboard/owned-form-request';
import { rateLimit } from '@/lib/rate-limit';
import {
  executeCreateOwnerEvent,
  executeDeleteOwnerEvent,
  executeUpdateOwnerEvent,
  ownerEventErrorMessage,
  type OwnerEventMutationState,
} from '@/lib/schedule/owner-events-core';

export const dynamic = 'force-dynamic';

const OPS = new Set(['create', 'update', 'delete']);

function clientBody(result: OwnerEventMutationState) {
  return {
    success: Boolean(result.success),
    error: result.error,
    code: result.code,
    event: result.event,
  };
}

function statusFor(result: OwnerEventMutationState): number {
  if (result.success) return 200;
  switch (result.code) {
    case 'UNAUTHENTICATED':
      return 401;
    case 'NOT_FOUND':
      return 404;
    case 'INVALID_INPUT':
    case 'LIMIT_REACHED':
      return 422;
    default:
      return 400;
  }
}

/**
 * Create, edit, or delete a calendar event without re-rendering Home.
 * A Server Action refresh was leaving the calendar unable to take clicks.
 */
export async function POST(request: Request) {
  const opened = await readOwnedFormPost(request, 16 * 1024);
  if (!opened.ok) return opened.response;

  const op = new URL(request.url).searchParams.get('op');
  if (!op || !OPS.has(op)) return apiError('Unknown event action.', 400);

  const { supabase, user, formData } = opened;
  const limited = await rateLimit(`connections:user:${user.id}`, 'connections');
  if (!limited.success) {
    const result: OwnerEventMutationState = {
      error: ownerEventErrorMessage('TEMPORARY_FAILURE'),
      code: 'TEMPORARY_FAILURE',
    };
    return ownedMutationJson(clientBody(result), 429);
  }

  const title = String(formData.get('title') ?? '');
  const locationRaw = formData.get('location');
  const startsAt = String(formData.get('startsAt') ?? '');
  const eventId = String(formData.get('eventId') ?? '');
  const location = locationRaw == null || String(locationRaw).trim() === '' ? null : String(locationRaw);

  let result: OwnerEventMutationState;
  if (op === 'create') {
    result = await executeCreateOwnerEvent(supabase, { title, location, startsAt }, { user });
  } else if (op === 'update') {
    result = await executeUpdateOwnerEvent(
      supabase,
      { eventId, title, location, startsAt },
      { user },
    );
  } else {
    result = await executeDeleteOwnerEvent(supabase, { eventId }, { user });
  }

  return ownedMutationJson(clientBody(result), statusFor(result));
}

export async function GET() {
  return apiError('Method not allowed', 405);
}
