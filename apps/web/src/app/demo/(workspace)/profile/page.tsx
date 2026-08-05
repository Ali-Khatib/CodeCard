import { redirect } from 'next/navigation';
import { LIVE_DEMO_WORKSPACE_HREF } from '@/lib/marketing/demo-url';

export default function DemoWorkspaceProfilePage() {
  redirect(LIVE_DEMO_WORKSPACE_HREF);
}
