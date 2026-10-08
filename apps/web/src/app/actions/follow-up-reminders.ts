'use server';

import { createClient } from '@/lib/supabase/server';
import {
  listConnectionDetailNudges,
  listDueFollowUpReminders,
  type FollowUpReminder,
} from '@/lib/connections/follow-up-reminders';

export async function listDueFollowUpRemindersAction(): Promise<{
  reminders: FollowUpReminder[];
  error?: string;
}> {
  const supabase = await createClient();
  return listDueFollowUpReminders(supabase);
}

export async function listConnectionDetailNudgesAction(): Promise<{
  reminders: FollowUpReminder[];
  error?: string;
}> {
  const supabase = await createClient();
  return listConnectionDetailNudges(supabase);
}
