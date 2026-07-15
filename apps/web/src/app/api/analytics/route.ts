import { NextResponse } from 'next/server';
import { analyticsEventSchema } from '@codecard/validation';
import { createClient } from '@/lib/supabase/server';
import { secureJsonRoute } from '@/lib/security/secure-route';

export async function POST(request: Request) {
  return secureJsonRoute(request, { schema: analyticsEventSchema, rateLimitType: 'analytics' }, async (data) => {
    const supabase = await createClient();
    const {
      event_type,
      profile_id,
      project_id,
      research_paper_id,
      target_type,
      target_id,
      section_name,
      metadata,
      source,
      referrer,
      session_id,
    } = data;

    if (event_type === 'profile_view' && profile_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', profile_id)
        .eq('is_public', true)
        .single();

      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      await supabase.from('public_profile_events').insert({
        tenant_id: profile.tenant_id,
        profile_id,
        source,
        referrer,
        session_id,
      });

      await supabase.from('analytics_events').insert({
        tenant_id: profile.tenant_id,
        profile_id,
        target_type: 'profile',
        target_id: profile_id,
        event_type,
        metadata: metadata ?? {},
        session_id,
      });
    }

    if (
      (event_type === 'profile_share' || event_type === 'qr_download') &&
      profile_id
    ) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Owner-only actions: never accept client claims of another profile.
      if (!user) {
        return NextResponse.json({ ok: true });
      }

      const { data: ownedProfile } = await supabase
        .from('profiles')
        .select('tenant_id, is_public')
        .eq('id', profile_id)
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (!ownedProfile) {
        return NextResponse.json({ ok: true });
      }

      // Existing RLS only allows profile-target inserts when the profile is public.
      if (ownedProfile.is_public) {
        await supabase.from('analytics_events').insert({
          tenant_id: ownedProfile.tenant_id,
          profile_id,
          user_id: user.id,
          target_type: 'profile',
          target_id: profile_id,
          event_type,
          metadata: metadata ?? {},
          session_id,
        });
      }

      return NextResponse.json({ ok: true });
    }

    if (event_type === 'project_view' && project_id && profile_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('tenant_id')
        .eq('id', project_id)
        .eq('is_published', true)
        .single();

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      await supabase.from('project_view_events').insert({
        tenant_id: project.tenant_id,
        project_id,
        profile_id,
        source,
        session_id,
      });
    }

    const resolvedTargetType =
      target_type ?? (research_paper_id ? 'research' : project_id ? 'project' : profile_id ? 'profile' : null);
    const resolvedTargetId = target_id ?? research_paper_id ?? project_id ?? profile_id ?? null;

    if (resolvedTargetType === 'project' && resolvedTargetId && profile_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('tenant_id, profile_id')
        .eq('id', resolvedTargetId)
        .eq('is_published', true)
        .single();

      if (project) {
        await supabase.from('analytics_events').insert({
          tenant_id: project.tenant_id,
          profile_id: project.profile_id ?? profile_id,
          target_type: 'project',
          target_id: resolvedTargetId,
          event_type,
          section_name,
          metadata: metadata ?? {},
          session_id,
        });
      }
    }

    if (resolvedTargetType === 'research' && resolvedTargetId) {
      const { data: paper } = await supabase
        .from('research_papers')
        .select('tenant_id, profile_id')
        .eq('id', resolvedTargetId)
        .eq('is_published', true)
        .single();

      if (!paper && event_type === 'research_view') {
        return NextResponse.json({ error: 'Research paper not found' }, { status: 404 });
      }

      if (paper) {
        await supabase.from('analytics_events').insert({
          tenant_id: paper.tenant_id,
          profile_id: paper.profile_id,
          target_type: 'research',
          target_id: resolvedTargetId,
          event_type,
          section_name,
          metadata: metadata ?? {},
          session_id,
        });
      }
    }

    return NextResponse.json({ ok: true });
  });
}
