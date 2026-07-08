import type { WorkspaceConnection } from './workspace-demo';

export function getUpcomingFollowUps(connections: WorkspaceConnection[]) {
  return connections
    .filter((c) => c.followUp === 'scheduled')
    .sort((a, b) => {
      const aTime = a.followUpDate ? Date.parse(a.followUpDate) : 0;
      const bTime = b.followUpDate ? Date.parse(b.followUpDate) : 0;
      return aTime - bTime;
    });
}
