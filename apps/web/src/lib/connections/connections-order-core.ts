import { reorderConnectionsSchema } from '@codecard/validation';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getAuthenticatedUser,
  type AuthUser,
} from '@/lib/profile/profile-auth-core';
import { CONNECTIONS_TABLE } from '@/lib/connections/connections-contract';

export type ConnectionReorderState = {
  success?: boolean;
  error?: string;
};

export function moveIndex<T>(items: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return items;
  next.splice(to, 0, moved);
  return next;
}

export function weaveVisibleOrder(allIds: string[], nextVisibleIds: string[]): string[] {
  const allSet = new Set(allIds);
  const orderedVisible = nextVisibleIds.filter((id) => allSet.has(id));
  const visible = new Set(orderedVisible);
  let index = 0;
  return allIds.map((id) => (visible.has(id) ? orderedVisible[index++]! : id));
}

export async function executeReorderConnections(
  supabase: SupabaseClient,
  connectionIds: string[],
  options?: { user?: AuthUser | null },
): Promise<ConnectionReorderState> {
  const user = await getAuthenticatedUser(supabase, options);
  if (!user) {
    return { error: 'You must be signed in to manage Connections.' };
  }

  const parsed = reorderConnectionsSchema.safeParse({
    connection_ids: connectionIds,
  });
  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? 'Could not reorder Connections.',
    };
  }

  const unique = new Set(parsed.data.connection_ids);
  if (unique.size !== parsed.data.connection_ids.length) {
    return { error: 'Could not reorder Connections.' };
  }

  const { data: ownedRows, error: ownedError } = await supabase
    .from(CONNECTIONS_TABLE)
    .select('id')
    .eq('owner_user_id', user.id);

  if (ownedError || !ownedRows) {
    return { error: 'Could not reorder Connections.' };
  }

  const ownedIds = new Set(ownedRows.map((row) => row.id as string));
  if (parsed.data.connection_ids.length !== ownedIds.size) {
    return { error: 'Could not reorder Connections.' };
  }

  for (const connectionId of parsed.data.connection_ids) {
    if (!ownedIds.has(connectionId)) {
      return { error: 'Could not reorder Connections.' };
    }
  }

  const sortUpdates = await Promise.all(
    parsed.data.connection_ids.map((connectionId, index) =>
      supabase
        .from(CONNECTIONS_TABLE)
        .update({ sort_order: index })
        .eq('id', connectionId)
        .eq('owner_user_id', user.id),
    ),
  );

  if (sortUpdates.some((result) => result.error)) {
    return { error: 'Could not reorder Connections.' };
  }

  return { success: true };
}
