import { redirect } from 'next/navigation';
import { LIVE_DEMO_HREF } from '@/lib/marketing/demo-url';

export default function DemoPage() {
  redirect(LIVE_DEMO_HREF);
}
