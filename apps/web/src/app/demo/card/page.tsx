import { permanentRedirect } from 'next/navigation';
import { LIVE_DEMO_PROFILE_HREF } from '@/lib/marketing/demo-url';

/** Backward-compatible alias for the public-profile demo. */
export default function DemoCardAliasPage() {
  permanentRedirect(LIVE_DEMO_PROFILE_HREF);
}
