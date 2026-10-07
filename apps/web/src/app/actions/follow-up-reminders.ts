'use server';

import { createClient } from '@/lib/supabase/server';
import {
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
