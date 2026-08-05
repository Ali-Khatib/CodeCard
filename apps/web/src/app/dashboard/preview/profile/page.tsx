import { permanentRedirect } from 'next/navigation';
import { LIVE_DEMO_WORKSPACE_HREF } from '@/lib/marketing/demo-url';

export default function PreviewProfileAliasPage() {
  permanentRedirect(LIVE_DEMO_WORKSPACE_HREF);
}
