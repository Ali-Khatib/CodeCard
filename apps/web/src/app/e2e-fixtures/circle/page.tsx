import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { CircleHarness } from '@/components/e2e/circle-harness';

export const dynamic = 'force-dynamic';

export default async function CircleFixturePage() {
  const requestHeaders = await headers();
  const fixtureEnabled =
    process.env.CODECARD_E2E_FIXTURES === '1' &&
    requestHeaders.get('x-codecard-e2e-fixture') === 'circle';

  if (!fixtureEnabled) {
    notFound();
  }

  return <CircleHarness />;
}
