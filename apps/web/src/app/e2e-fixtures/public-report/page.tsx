import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { PublicReportHarness } from '@/components/e2e/public-report-harness';

export const dynamic = 'force-dynamic';

export default async function PublicReportFixturePage() {
  const requestHeaders = await headers();
  const fixtureEnabled =
    process.env.CODECARD_E2E_FIXTURES === '1' &&
    requestHeaders.get('x-codecard-e2e-fixture') === 'public-report';

  if (!fixtureEnabled) notFound();
  return <PublicReportHarness />;
}
