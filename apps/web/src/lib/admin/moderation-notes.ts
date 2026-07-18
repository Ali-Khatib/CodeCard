import 'server-only';

import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

export const MODERATION_NOTE_MAX_LENGTH = 4000;

export const moderationNoteUpdateSchema = z
  .object({
    note: z.string().max(MODERATION_NOTE_MAX_LENGTH).nullable(),
    expectedUpdatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type ModerationNoteUpdateResult =
  | {
      ok: true;
      outcome: 'updated' | 'idempotent';
      notePresent: boolean;
      noteLength: number;
      updatedAt: string;
      auditInserted: boolean;
    }
  | {
      ok: false;
      reason: 'not_found' | 'conflict' | 'too_large' | 'service_unavailable';
      updatedAt?: string;
    };

type PrivilegedClient = Awaited<ReturnType<typeof createServiceClient>>;

export async function updateModerationNote(
  input: {
    actorUserId: string;
    reportId: string;
    note: string | null;
    expectedUpdatedAt: string;
  },
  deps?: { createPrivilegedClient?: () => Promise<PrivilegedClient> },
): Promise<ModerationNoteUpdateResult> {
  try {
    const service = await (deps?.createPrivilegedClient ?? createServiceClient)();
    const normalizedNote = input.note === null ? null : input.note.trim() || null;
    const { data, error } = await service.rpc('admin_update_moderation_note', {
      p_actor_user_id: input.actorUserId,
      p_report_id: input.reportId,
      p_note: normalizedNote,
      p_expected_updated_at: input.expectedUpdatedAt,
    });

    if (error) return { ok: false, reason: 'service_unavailable' };

    const payload = (Array.isArray(data) ? data[0] : data) as
      | {
          outcome?: unknown;
          note_present?: unknown;
          note_length?: unknown;
          updated_at?: unknown;
          audit_inserted?: unknown;
        }
      | null;

    if (!payload || typeof payload.outcome !== 'string') {
      return { ok: false, reason: 'service_unavailable' };
    }
    if (payload.outcome === 'not_found' || payload.outcome === 'too_large') {
      return { ok: false, reason: payload.outcome };
    }
    if (payload.outcome === 'conflict') {
      return {
        ok: false,
        reason: 'conflict',
        updatedAt:
          typeof payload.updated_at === 'string' ? payload.updated_at : undefined,
      };
    }
    if (
      (payload.outcome !== 'updated' && payload.outcome !== 'idempotent') ||
      typeof payload.note_present !== 'boolean' ||
      typeof payload.note_length !== 'number' ||
      typeof payload.updated_at !== 'string'
    ) {
      return { ok: false, reason: 'service_unavailable' };
    }

    return {
      ok: true,
      outcome: payload.outcome,
      notePresent: payload.note_present,
      noteLength: payload.note_length,
      updatedAt: payload.updated_at,
      auditInserted: payload.audit_inserted === true,
    };
  } catch {
    return { ok: false, reason: 'service_unavailable' };
  }
}
