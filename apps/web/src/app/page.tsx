import { redirect } from 'next/navigation';
import { LIVE_DEMO_ENTRY_HREF } from '@/lib/marketing/site-routes';

export default function HomePage() {
  redirect(LIVE_DEMO_ENTRY_HREF);
}
