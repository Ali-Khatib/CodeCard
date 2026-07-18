import 'server-only';

import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

export const MODERATION_STATUSES = [
  'pending',
  'reviewing',
  'resolved',
  'dismissed',
] as const;
export const MODERATION_TARGET_TYPES = ['profile', 'project', 'media'] as const;
export const ADMIN_PAGE_SIZE_MAX = 50;
export const ADMIN_PAGE_SIZE_DEFAULT = 20;

const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(ADMIN_PAGE_SIZE_MAX)
    .default(ADMIN_PAGE_SIZE_DEFAULT),
};

export const moderationReportListQuerySchema = z.object({
  ...paginationFields,
  status: z.enum(MODERATION_STATUSES).default('pending'),
  targetType: z.enum(MODERATION_TARGET_TYPES).optional(),
});

export const dmcaNoticeListQuerySchema = z.object({
  ...paginationFields,
  status: z.enum(MODERATION_STATUSES).default('pending'),
});

export type ModerationReportListQuery = z.infer<typeof moderationReportListQuerySchema>;
export type DmcaNoticeListQuery = z.infer<typeof dmcaNoticeListQuerySchema>;

export type AdminModerationReportDto = {
  id: string;
  targetType: (typeof MODERATION_TARGET_TYPES)[number];
  targetId: string;
  reasonPreview: string;
  status: (typeof MODERATION_STATUSES)[number];
  createdAt: string;
  updatedAt: string;
};

export type AdminDmcaNoticeDto = {
  id: string;
  claimantName: string;
  copyrightedWorkPreview: string;
  infringingUrl: string;
  status: (typeof MODERATION_STATUSES)[number];
  createdAt: string;
  updatedAt: string;
};

export type AdminPaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
};

type PrivilegedClient = Awaited<ReturnType<typeof createServiceClient>>;

export type AdminModerationDataDependencies = {
  createPrivilegedClient?: () => Promise<PrivilegedClient>;
};

const REPORT_COLUMNS = 'id, target_type, target_id, reason, status, created_at, updated_at';
const DMCA_COLUMNS =
  'id, claimant_name, copyrighted_work, infringing_url, status, created_at, updated_at';

function boundedText(value: unknown, maximum: number): string {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length <= maximum ? text : `${text.slice(0, maximum - 1).trimEnd()}…`;
}

function pageRange(page: number, pageSize: number): [number, number] {
  const from = (page - 1) * pageSize;
  return [from, from + pageSize - 1];
}

async function privilegedClient(deps?: AdminModerationDataDependencies) {
  return (deps?.createPrivilegedClient ?? createServiceClient)();
}

export async function listModerationReports(
  input: ModerationReportListQuery,
  deps?: AdminModerationDataDependencies,
): Promise<AdminPaginatedResult<AdminModerationReportDto>> {
  const service = await privilegedClient(deps);
  const [from, to] = pageRange(input.page, input.pageSize);

  let query = service
    .from('moderation_reports')
    .select(REPORT_COLUMNS, { count: 'exact' })
    .eq('status', input.status);

  if (input.targetType) {
    query = query.eq('target_type', input.targetType);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error('ADMIN_MODERATION_READ_FAILED');
  }

  const items = (data ?? []).map((row) => ({
    id: String(row.id),
    targetType: row.target_type as AdminModerationReportDto['targetType'],
    targetId: String(row.target_id),
    reasonPreview: boundedText(row.reason, 500),
    status: row.status as AdminModerationReportDto['status'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
  const total = count ?? items.length;

  return {
    items,
    page: input.page,
    pageSize: input.pageSize,
    total,
    hasNextPage: from + items.length < total,
  };
}

export async function listDmcaNotices(
  input: DmcaNoticeListQuery,
  deps?: AdminModerationDataDependencies,
): Promise<AdminPaginatedResult<AdminDmcaNoticeDto>> {
  const service = await privilegedClient(deps);
  const [from, to] = pageRange(input.page, input.pageSize);
  const { data, error, count } = await service
    .from('dmca_notices')
    .select(DMCA_COLUMNS, { count: 'exact' })
    .eq('status', input.status)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error('ADMIN_DMCA_READ_FAILED');
  }

  const items = (data ?? []).map((row) => ({
    id: String(row.id),
    claimantName: boundedText(row.claimant_name, 120),
    copyrightedWorkPreview: boundedText(row.copyrighted_work, 300),
    infringingUrl: boundedText(row.infringing_url, 2048),
    status: row.status as AdminDmcaNoticeDto['status'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
  const total = count ?? items.length;

  return {
    items,
    page: input.page,
    pageSize: input.pageSize,
    total,
    hasNextPage: from + items.length < total,
  };
}

export const ADMIN_MODERATION_EXPLICIT_COLUMNS = {
  reports: REPORT_COLUMNS,
  dmca: DMCA_COLUMNS,
} as const;
