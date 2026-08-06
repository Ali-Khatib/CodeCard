import { permanentRedirect } from 'next/navigation';
import { LIVE_DEMO_WORKSPACE_HREF } from '@/lib/marketing/demo-url';

export const dynamic = 'force-static';

/** Public-profile demo retired — live demo is the workspace at `/demo`. */
export default function DemoCardPage() {
  permanentRedirect(LIVE_DEMO_WORKSPACE_HREF);
}
