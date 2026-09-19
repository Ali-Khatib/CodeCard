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

/** Keep follow-up dots on the printed calendar day, not the UTC day before. */
export function followUpDisplayDateToIso(display: string): string {
  const parsed = new Date(display);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return new Date(
    Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0),
  ).toISOString();
}

export function followUpsToHomeItems(connections: WorkspaceConnection[]): HomeFollowUp[] {
  return getUpcomingFollowUps(connections).map((c) => ({
    connectionId: c.id,
    personName: c.name,
    context: c.meetingPoint || null,
    followUpAt: c.followUpDate ? followUpDisplayDateToIso(c.followUpDate) : new Date().toISOString(),
  }));
}
