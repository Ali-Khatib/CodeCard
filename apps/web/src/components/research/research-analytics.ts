'use client';

import { createSessionId, trackEvent } from '@codecard/analytics';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function canTrackId(id?: string | null) {
  return Boolean(id && UUID_RE.test(id));
}

export function trackResearchEvent({
  eventType,
  profileId,
  researchPaperId,
  sectionName,
  metadata,
}: {
  eventType:
    | 'research_view'
    | 'paper_download'
    | 'citation_copy'
    | 'abstract_expand'
    | 'figure_view'
    | 'related_project_click'
    | 'time_spent_on_research';
  profileId?: string;
  researchPaperId: string;
  sectionName?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!canTrackId(profileId) || !canTrackId(researchPaperId)) return;

  void trackEvent('/api/analytics', {
    event_type: eventType,
    profile_id: profileId,
    research_paper_id: researchPaperId,
    target_type: 'research',
    target_id: researchPaperId,
    section_name: sectionName,
    metadata,
    session_id: createSessionId(),
  });
}

export function trackProjectEngagementEvent({
  eventType,
  profileId,
  projectId,
  sectionName,
  metadata,
}: {
  eventType:
    | 'project_time_spent'
    | 'project_section_time_spent'
    | 'project_section_view'
    | 'project_section_hover_or_click';
  profileId?: string;
  projectId: string;
  sectionName?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!canTrackId(profileId) || !canTrackId(projectId)) return;

  void trackEvent('/api/analytics', {
    event_type: eventType,
    profile_id: profileId,
    project_id: projectId,
    target_type: 'project',
    target_id: projectId,
    section_name: sectionName,
    metadata,
    session_id: createSessionId(),
  });
}
