import { permanentRedirect } from 'next/navigation';
import { LIVE_DEMO_WORKSPACE_HREF } from '@/lib/marketing/demo-url';

/** Compatible alias — workspace live demo lives at `/demo`. */
export default function PreviewDashboardAliasPage() {
  permanentRedirect(LIVE_DEMO_WORKSPACE_HREF);
}
