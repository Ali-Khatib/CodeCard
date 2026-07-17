import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { XssPublicHarness } from '@/components/e2e/xss-public-harness';

export const dynamic = 'force-dynamic';

export default async function XssPublicFixturePage() {
  const requestHeaders = await headers();
  const fixtureEnabled =
    process.env.CODECARD_E2E_FIXTURES === '1' &&
    requestHeaders.get('x-codecard-e2e-fixture') === 'xss-public';

  if (!fixtureEnabled) {
    notFound();
  }

  return <XssPublicHarness />;
}
