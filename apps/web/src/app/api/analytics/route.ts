import { NextResponse } from 'next/server';
import { analyticsEventSchema } from '@codecard/validation';
import { createClient } from '@/lib/supabase/server';
import { secureJsonRoute } from '@/lib/security/secure-route';

export async function POST(request: Request) {
  return secureJsonRoute(request, { schema: analyticsEventSchema, rateLimitType: 'analytics' }, async (data) => {
    const supabase = await createClient();
    const { event_type, profile_id, project_id, source, referrer, session_id } = data;

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

    return NextResponse.json({ ok: true });
  });
}
