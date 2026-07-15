import type { SupabaseClient } from '@supabase/supabase-js';
import type { ResearchRelatedProjectOption } from '@/lib/research/research-form';

export async function loadOwnedProjectsForResearchPicker(
  supabase: SupabaseClient,
  input: { userId: string; profileId: string; tenantId: string },
): Promise<ResearchRelatedProjectOption[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, slug')
    .eq('owner_user_id', input.userId)
    .eq('profile_id', input.profileId)
    .eq('tenant_id', input.tenantId)
    .order('title', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    title: (row.title as string) || 'Untitled project',
    slug: (row.slug as string) || (row.id as string).slice(0, 8),
  }));
}
