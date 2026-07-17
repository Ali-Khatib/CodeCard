import type { ReactNode } from 'react';
import { enforceGlobalAdminAccess } from '@/lib/security/admin-route-gate';

/**
 * WS11-T002 — Server-side global-admin gate for the whole `/admin` tree.
 *
 * Layouts and pages render in parallel in the App Router, so this layout is
 * defense in depth for nested routes; every admin page must also await
 * `enforceGlobalAdminAccess()` before fetching data.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await enforceGlobalAdminAccess();
  return <>{children}</>;
}
