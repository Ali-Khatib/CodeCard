import Link from 'next/link';
import type {
  AdminDmcaNoticeDto,
  AdminModerationReportDto,
  AdminPaginatedResult,
} from '@/lib/admin/moderation-data';
import { MODERATION_STATUSES, MODERATION_TARGET_TYPES } from '@/lib/admin/moderation-data';
import { toSafeHttpHref } from '@/lib/security/safe-href';
import { ReportActions } from '@/components/admin/report-actions';

type ListState<T> =
  | { status: 'ready'; data: AdminPaginatedResult<T> }
  | { status: 'error' };

type DashboardFilters = {
  reportStatus: string;
  targetType?: string;
  reportsPage: number;
  dmcaStatus: string;
  dmcaPage: number;
};

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date);
}

function humanize(value: string): string {
  return value.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase());
}

function pageHref(filters: DashboardFilters, updates: Record<string, string | number>) {
  const params = new URLSearchParams({
    reportStatus: filters.reportStatus,
    reportsPage: String(filters.reportsPage),
    dmcaStatus: filters.dmcaStatus,
    dmcaPage: String(filters.dmcaPage),
  });
  if (filters.targetType) params.set('targetType', filters.targetType);
  for (const [key, value] of Object.entries(updates)) params.set(key, String(value));
  return `/admin?${params.toString()}`;
}

function Pagination({
  label,
  page,
  hasNextPage,
  previousHref,
  nextHref,
}: {
  label: string;
  page: number;
  hasNextPage: boolean;
  previousHref: string;
  nextHref: string;
}) {
  return (
    <nav className="mt-5 flex items-center justify-between gap-3" aria-label={label}>
      {page > 1 ? (
        <Link className="cc-app-btn cc-app-btn--ghost min-h-11" href={previousHref}>
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-[var(--app-smoke)]">Page {page}</span>
      {hasNextPage ? (
        <Link className="cc-app-btn cc-app-btn--ghost min-h-11" href={nextHref}>
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full border border-current/25 px-2.5 py-1 text-xs font-semibold">
      Status: {humanize(status)}
    </span>
  );
}

export function AdminModerationDashboard({
  reports,
  dmca,
  filters,
}: {
  reports: ListState<AdminModerationReportDto>;
  dmca: ListState<AdminDmcaNoticeDto>;
  filters: DashboardFilters;
}) {
  return (
    <div className="min-h-screen text-[var(--app-ink)]">
      <header className="border-b border-[var(--app-line)] px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="cc-app-btn cc-app-btn--ghost min-h-11">
          ← Dashboard
        </Link>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">Moderation</h1>
        <p className="mt-2 text-[var(--app-smoke)]">
          Review private abuse reports and legally distinct DMCA notices.
        </p>

        <section className="mt-10" aria-labelledby="reports-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="reports-heading" className="text-xl font-semibold">
                Moderation reports
              </h2>
              <p className="mt-1 text-sm text-[var(--app-smoke)]">
                Pending reports are shown by default, newest first.
              </p>
            </div>
            <form method="get" className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="dmcaStatus" value={filters.dmcaStatus} />
              <input type="hidden" name="dmcaPage" value={filters.dmcaPage} />
              <label className="grid gap-1 text-sm">
                <span>Status</span>
                <select
                  name="reportStatus"
                  defaultValue={filters.reportStatus}
                  className="min-h-11 rounded-lg border border-[var(--app-line)] bg-transparent px-3"
                >
                  {MODERATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {humanize(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span>Target type</span>
                <select
                  name="targetType"
                  defaultValue={filters.targetType ?? ''}
                  className="min-h-11 rounded-lg border border-[var(--app-line)] bg-transparent px-3"
                >
                  <option value="">All targets</option>
                  {MODERATION_TARGET_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {humanize(type)}
                    </option>
                  ))}
                </select>
              </label>
              <button className="cc-app-btn cc-app-btn--primary min-h-11" type="submit">
                Apply filters
              </button>
            </form>
          </div>

          {reports.status === 'error' ? (
            <div role="alert" className="mt-5 rounded-xl border border-red-500/30 p-4">
              Reports could not be loaded. Please try again.
            </div>
          ) : reports.data.items.length === 0 ? (
            <p className="mt-5 rounded-xl border border-[var(--app-line)] p-5">
              No reports match these filters.
            </p>
          ) : (
            <ul className="mt-5 grid gap-4" aria-label="Moderation reports">
              {reports.data.items.map((report) => (
                <li
                  key={report.id}
                  className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {humanize(report.targetType)} report
                      </p>
                      <p className="mt-1 font-mono text-xs text-[var(--app-smoke)]">
                        Reference {report.targetId.slice(0, 8)}
                      </p>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>
                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {report.reasonPreview || 'No reason supplied.'}
                  </p>
                  <time
                    className="mt-4 block text-xs text-[var(--app-smoke)]"
                    dateTime={report.createdAt}
                  >
                    Submitted {formatTimestamp(report.createdAt)} UTC
                  </time>
                  {report.status === 'pending' && (
                    <ReportActions
                      reportId={report.id}
                      targetLabel={humanize(report.targetType).toLowerCase()}
                      targetType={report.targetType}
                      targetId={report.targetId}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}

          {reports.status === 'ready' && (
            <Pagination
              label="Moderation report pages"
              page={reports.data.page}
              hasNextPage={reports.data.hasNextPage}
              previousHref={pageHref(filters, { reportsPage: reports.data.page - 1 })}
              nextHref={pageHref(filters, { reportsPage: reports.data.page + 1 })}
            />
          )}
        </section>

        <section className="mt-14" aria-labelledby="dmca-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="dmca-heading" className="text-xl font-semibold">
                DMCA notices
              </h2>
              <p className="mt-1 text-sm text-[var(--app-smoke)]">
                Legal notices remain separate from ordinary reports.
              </p>
            </div>
            <form method="get" className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="reportStatus" value={filters.reportStatus} />
              <input type="hidden" name="reportsPage" value={filters.reportsPage} />
              {filters.targetType && (
                <input type="hidden" name="targetType" value={filters.targetType} />
              )}
              <label className="grid gap-1 text-sm">
                <span>DMCA status</span>
                <select
                  name="dmcaStatus"
                  defaultValue={filters.dmcaStatus}
                  className="min-h-11 rounded-lg border border-[var(--app-line)] bg-transparent px-3"
                >
                  {MODERATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {humanize(status)}
                    </option>
                  ))}
                </select>
              </label>
              <button className="cc-app-btn cc-app-btn--primary min-h-11" type="submit">
                Apply filter
              </button>
            </form>
          </div>

          {dmca.status === 'error' ? (
            <div role="alert" className="mt-5 rounded-xl border border-red-500/30 p-4">
              DMCA notices could not be loaded. Please try again.
            </div>
          ) : dmca.data.items.length === 0 ? (
            <p className="mt-5 rounded-xl border border-[var(--app-line)] p-5">
              No DMCA notices match this filter.
            </p>
          ) : (
            <ul className="mt-5 grid gap-4" aria-label="DMCA notices">
              {dmca.data.items.map((notice) => {
                const safeUrl = toSafeHttpHref(notice.infringingUrl);
                return (
                  <li
                    key={notice.id}
                    className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{notice.claimantName}</p>
                        <p className="mt-1 text-sm text-[var(--app-smoke)]">
                          {notice.copyrightedWorkPreview}
                        </p>
                      </div>
                      <StatusBadge status={notice.status} />
                    </div>
                    {safeUrl && (
                      <a
                        className="mt-4 block break-all text-sm underline underline-offset-4"
                        href={safeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Review referenced URL
                      </a>
                    )}
                    <time
                      className="mt-4 block text-xs text-[var(--app-smoke)]"
                      dateTime={notice.createdAt}
                    >
                      Submitted {formatTimestamp(notice.createdAt)} UTC
                    </time>
                  </li>
                );
              })}
            </ul>
          )}

          {dmca.status === 'ready' && (
            <Pagination
              label="DMCA notice pages"
              page={dmca.data.page}
              hasNextPage={dmca.data.hasNextPage}
              previousHref={pageHref(filters, { dmcaPage: dmca.data.page - 1 })}
              nextHref={pageHref(filters, { dmcaPage: dmca.data.page + 1 })}
            />
          )}
        </section>
      </main>
    </div>
  );
}
