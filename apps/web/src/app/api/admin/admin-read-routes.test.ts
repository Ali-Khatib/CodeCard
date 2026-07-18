import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getReports } from './reports/route';
import { GET as getDmca } from './dmca/route';

const mockRequireAdmin = vi.fn();
const mockListReports = vi.fn();
const mockListDmca = vi.fn();

vi.mock('@/lib/security/admin-api-authorization', () => ({
  requireGlobalAdminApiAccess: (...args: unknown[]) => mockRequireAdmin(...args),
}));

vi.mock('@/lib/admin/moderation-data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/admin/moderation-data')>();
  return {
    ...actual,
    listModerationReports: (...args: unknown[]) => mockListReports(...args),
    listDmcaNotices: (...args: unknown[]) => mockListDmca(...args),
  };
});

const emptyResult = {
  items: [],
  page: 1,
  pageSize: 20,
  total: 0,
  hasNextPage: false,
};

describe('admin privileged read routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({
      ok: true,
      userId: '11111111-1111-4111-8111-111111111111',
    });
    mockListReports.mockResolvedValue(emptyResult);
    mockListDmca.mockResolvedValue(emptyResult);
  });

  it.each([
    ['reports', getReports, mockListReports],
    ['dmca', getDmca, mockListDmca],
  ])('does not create/use privileged data before %s authorization', async (_, handler, reader) => {
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const response = await handler(new Request(`https://codecard.app/api/admin/${String(_)}`));

    expect(response.status).toBe(401);
    expect(reader).not.toHaveBeenCalled();
  });

  it('returns paginated reports with private no-store caching', async () => {
    const response = await getReports(
      new Request(
        'https://codecard.app/api/admin/reports?page=2&pageSize=10&status=resolved&targetType=project',
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('private');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(mockListReports).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      status: 'resolved',
      targetType: 'project',
    });
  });

  it('returns paginated DMCA notices with private no-store caching', async () => {
    const response = await getDmca(
      new Request('https://codecard.app/api/admin/dmca?page=3&pageSize=5&status=reviewing'),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(mockListDmca).toHaveBeenCalledWith({
      page: 3,
      pageSize: 5,
      status: 'reviewing',
    });
  });

  it.each([
    ['invalid page', 'reports?page=0'],
    ['oversized page', 'reports?pageSize=51'],
    ['invalid status', 'reports?status=closed'],
    ['invalid target', 'reports?targetType=account'],
    ['invalid DMCA status', 'dmca?status=closed'],
  ])('rejects %s filters before privileged reads', async (_, path) => {
    const handler = path.startsWith('dmca') ? getDmca : getReports;
    const response = await handler(new Request(`https://codecard.app/api/admin/${path}`));

    expect(response.status).toBe(422);
    expect(mockListReports).not.toHaveBeenCalled();
    expect(mockListDmca).not.toHaveBeenCalled();
  });

  it('returns an opaque error instead of raw provider details', async () => {
    mockListReports.mockRejectedValue(new Error('relation moderation_reports does not exist'));

    const response = await getReports(
      new Request('https://codecard.app/api/admin/reports'),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain('moderation_reports');
    expect(body).toEqual({ error: 'Something went wrong. Please try again.' });
  });
});
