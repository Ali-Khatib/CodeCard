import Link from 'next/link';
import { AdminModerationDashboard } from '@/components/admin/moderation-dashboard';
import {
  dmcaNoticeListQuerySchema,
  listDmcaNotices,
  listModerationReports,
  moderationReportListQuerySchema,
} from '@/lib/admin/moderation-data';
import { enforceGlobalAdminAccess } from '@/lib/security/admin-route-gate';
import { MAIN_CONTENT_ID } from '@/lib/a11y/main-content';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AdminSearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  // WS11-T002: authorize (global admin only) before any rendering or data fetch.
  await enforceGlobalAdminAccess();

  const query = await searchParams;
  const reportsQuery = moderationReportListQuerySchema.safeParse({
    page: first(query.reportsPage),
    pageSize: 20,
    status: first(query.reportStatus),
    targetType: first(query.targetType) || undefined,
  });
  const dmcaQuery = dmcaNoticeListQuerySchema.safeParse({
    page: first(query.dmcaPage),
    pageSize: 20,
    status: first(query.dmcaStatus),
  });

  if (!reportsQuery.success || !dmcaQuery.success) {
    return (
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Moderation</h1>
        <div role="alert" className="mt-6 rounded-xl border border-red-500/30 p-5">
          These filters are invalid. Return to the default moderation view.
        </div>
        <Link className="cc-app-btn cc-app-btn--primary mt-5 min-h-11" href="/admin">
          Reset filters
        </Link>
      </main>
    );
  }

  const [reportsResult, dmcaResult] = await Promise.allSettled([
    listModerationReports(reportsQuery.data),
    listDmcaNotices(dmcaQuery.data),
  ]);

  return (
    <AdminModerationDashboard
      reports={
        reportsResult.status === 'fulfilled'
          ? { status: 'ready', data: reportsResult.value }
          : { status: 'error' }
      }
      dmca={
        dmcaResult.status === 'fulfilled'
          ? { status: 'ready', data: dmcaResult.value }
          : { status: 'error' }
      }
      filters={{
        reportStatus: reportsQuery.data.status,
        targetType: reportsQuery.data.targetType,
        reportsPage: reportsQuery.data.page,
        dmcaStatus: dmcaQuery.data.status,
        dmcaPage: dmcaQuery.data.page,
      }}
    />
  );
}
