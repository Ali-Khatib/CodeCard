import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { UploadProgressHarness } from '@/components/e2e/upload-progress-harness';

export const dynamic = 'force-dynamic';

export default async function UploadProgressFixturePage() {
  const requestHeaders = await headers();
  const fixtureEnabled =
    process.env.CODECARD_E2E_FIXTURES === '1' &&
    requestHeaders.get('x-codecard-e2e-fixture') === 'upload-progress';

  if (!fixtureEnabled) {
    notFound();
  }

  return <UploadProgressHarness />;
}
