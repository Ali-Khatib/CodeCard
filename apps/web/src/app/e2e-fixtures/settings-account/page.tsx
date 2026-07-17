import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { SettingsAccountHarness } from '@/components/e2e/settings-account-harness';

export const dynamic = 'force-dynamic';

export default async function SettingsAccountFixturePage() {
  const requestHeaders = await headers();
  const fixtureEnabled =
    process.env.CODECARD_E2E_FIXTURES === '1' &&
    requestHeaders.get('x-codecard-e2e-fixture') === 'settings-account';

  if (!fixtureEnabled) {
    notFound();
  }

  return <SettingsAccountHarness />;
}
