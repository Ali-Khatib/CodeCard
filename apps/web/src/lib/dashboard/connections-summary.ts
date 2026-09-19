import type { WorkspaceConnection } from './workspace-demo';
import type { HomeFollowUp } from '@/lib/schedule/home-schedule-core';

export function getUpcomingFollowUps(connections: WorkspaceConnection[]) {
  return connections
    .filter((c) => c.followUp === 'scheduled')
    .sort((a, b) => {
      const aTime = a.followUpDate ? Date.parse(a.followUpDate) : 0;
      const bTime = b.followUpDate ? Date.parse(b.followUpDate) : 0;
      return aTime - bTime;
    });
}

export function followUpsToHomeItems(connections: WorkspaceConnection[]): HomeFollowUp[] {
  return getUpcomingFollowUps(connections).map((c) => ({
    connectionId: c.id,
    personName: c.name,
    context: c.meetingPoint || null,
    followUpAt: c.followUpDate
      ? new Date(c.followUpDate).toISOString()
      : new Date().toISOString(),
  }));
}
