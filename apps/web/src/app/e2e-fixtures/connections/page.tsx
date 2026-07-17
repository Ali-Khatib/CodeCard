import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ConnectionsHarness } from '@/components/e2e/connections-harness';

export const dynamic = 'force-dynamic';

export default async function ConnectionsFixturePage() {
  const requestHeaders = await headers();
  const fixtureEnabled =
    process.env.CODECARD_E2E_FIXTURES === '1' &&
    requestHeaders.get('x-codecard-e2e-fixture') === 'connections';

  if (!fixtureEnabled) {
    notFound();
  }

  return <ConnectionsHarness />;
}
