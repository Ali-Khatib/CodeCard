import { NextResponse } from 'next/server';
import { analyticsEventSchema } from '@codecard/validation';
import { createClient } from '@/lib/supabase/server';
import { secureJsonRoute } from '@/lib/security/secure-route';
import { isApprovedLinkCategory } from '@/lib/analytics/link-click';
import {
  isAuthenticatedContentOwner,
  isOwnerExcludedAudienceEvent,
} from '@/lib/analytics/owner-exclusion';
import {
  isDuplicateAnalyticsEvent,
  normalizeAnalyticsSessionId,
} from '@/lib/analytics/dedupe';
import { isObviousAnalyticsBot, sanitizeAnalyticsMetadata } from '@/lib/analytics/bot-filter';

export async function POST(request: Request) {
  return secureJsonRoute(request, { schema: analyticsEventSchema, rateLimitType: 'analytics' }, async (data) => {
    // After rate-limit + schema validation: ignore obvious automated agents.
    if (isObviousAnalyticsBot(request.headers.get('user-agent'))) {
      return NextResponse.json({ ok: true, status: 'ignored' });
    }

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
    } = data;
    const session_id = normalizeAnalyticsSessionId(data.session_id);
    const safeMetadata = sanitizeAnalyticsMetadata(metadata);

    const eventForDedupe = {
      event_type,
      session_id,
      profile_id,
      project_id,
      research_paper_id,
      target_type,
      target_id,
      section_name,
      source,
      metadata: safeMetadata,
    };

    if (event_type === 'link_click' && profile_id) {
      const linkKind = metadata?.link_kind === 'project' ? 'project' : 'profile';
      const linkCategory = metadata?.link_category;
      if (!isApprovedLinkCategory(linkKind, linkCategory)) {
        return NextResponse.json({ error: 'Invalid link category' }, { status: 400 });
      }

      if (linkKind === 'project') {
        if (!project_id) {
          return NextResponse.json({ error: 'Project required' }, { status: 400 });
        }
        const { data: project } = await supabase
          .from('projects')
          .select('tenant_id, profile_id, is_published')
          .eq('id', project_id)
          .eq('profile_id', profile_id)
          .eq('is_published', true)
          .maybeSingle();

        if (!project) {
          return NextResponse.json({ ok: true, status: 'ignored' });
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', project.profile_id)
          .eq('is_public', true)
          .maybeSingle();

        if (!profile) {
          return NextResponse.json({ ok: true, status: 'ignored' });
        }

        if (await isDuplicateAnalyticsEvent(supabase, eventForDedupe)) {
          return NextResponse.json({ ok: true, status: 'ignored' });
        }

        await supabase.from('analytics_events').insert({
          tenant_id: project.tenant_id,
          profile_id: project.profile_id,
          target_type: 'project',
          target_id: project_id,
          event_type: 'link_click',
          metadata: {
            link_category: linkCategory,
            link_kind: 'project',
          },
          session_id,
        });

        return NextResponse.json({ ok: true, status: 'recorded' });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', profile_id)
        .eq('is_public', true)
        .maybeSingle();

      if (!profile) {
        return NextResponse.json({ ok: true, status: 'ignored' });
      }

      if (await isDuplicateAnalyticsEvent(supabase, eventForDedupe)) {
        return NextResponse.json({ ok: true, status: 'ignored' });
      }

      await supabase.from('analytics_events').insert({
        tenant_id: profile.tenant_id,
        profile_id,
        target_type: 'profile',
        target_id: profile_id,
        event_type: 'link_click',
        metadata: {
          link_category: linkCategory,
          link_kind: 'profile',
        },
        session_id,
      });

      return NextResponse.json({ ok: true, status: 'recorded' });
    }

    // Audience views/time: skip when authenticated viewer owns the target (server-resolved).
    if (isOwnerExcludedAudienceEvent(event_type)) {
      const isOwner = await isAuthenticatedContentOwner(supabase, {
        profile_id,
        project_id,
        research_paper_id,
        target_type,
        target_id,
      });
      if (isOwner) {
        return NextResponse.json({ ok: true, status: 'ignored' });
      }
    }

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

      if (await isDuplicateAnalyticsEvent(supabase, eventForDedupe)) {
        return NextResponse.json({ ok: true, status: 'ignored' });
      }

      await supabase.from('public_profile_events').insert({
        tenant_id: profile.tenant_id,
        profile_id,
        source,
        referrer: null,
        session_id,
      });

      await supabase.from('analytics_events').insert({
        tenant_id: profile.tenant_id,
        profile_id,
        target_type: 'profile',
        target_id: profile_id,
        event_type,
        metadata: safeMetadata,
        session_id,
      });

      return NextResponse.json({ ok: true, status: 'recorded' });
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
        if (await isDuplicateAnalyticsEvent(supabase, eventForDedupe)) {
          return NextResponse.json({ ok: true, status: 'ignored' });
        }

        await supabase.from('analytics_events').insert({
          tenant_id: ownedProfile.tenant_id,
          profile_id,
          user_id: user.id,
          target_type: 'profile',
          target_id: profile_id,
          event_type,
          metadata: safeMetadata,
          session_id,
        });
      }

      return NextResponse.json({ ok: true });
    }

    if (event_type === 'project_view' && project_id && profile_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('tenant_id, profile_id')
        .eq('id', project_id)
        .eq('is_published', true)
        .single();

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      if (await isDuplicateAnalyticsEvent(supabase, eventForDedupe)) {
        return NextResponse.json({ ok: true, status: 'ignored' });
      }

      await supabase.from('project_view_events').insert({
        tenant_id: project.tenant_id,
        project_id,
        profile_id,
        source,
        session_id,
      });

      await supabase.from('analytics_events').insert({
        tenant_id: project.tenant_id,
        profile_id: project.profile_id ?? profile_id,
        target_type: 'project',
        target_id: project_id,
        event_type,
        section_name,
        metadata: safeMetadata,
        session_id,
      });

      return NextResponse.json({ ok: true, status: 'recorded' });
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
        if (await isDuplicateAnalyticsEvent(supabase, eventForDedupe)) {
          return NextResponse.json({ ok: true, status: 'ignored' });
        }

        await supabase.from('analytics_events').insert({
          tenant_id: project.tenant_id,
          profile_id: project.profile_id ?? profile_id,
          target_type: 'project',
          target_id: resolvedTargetId,
          event_type,
          section_name,
          metadata: safeMetadata,
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
        if (await isDuplicateAnalyticsEvent(supabase, eventForDedupe)) {
          return NextResponse.json({ ok: true, status: 'ignored' });
        }

        await supabase.from('analytics_events').insert({
          tenant_id: paper.tenant_id,
          profile_id: paper.profile_id,
          target_type: 'research',
          target_id: resolvedTargetId,
          event_type,
          section_name,
          metadata: safeMetadata,
          session_id,
        });
      }
    }

    return NextResponse.json({ ok: true });
  });
}
