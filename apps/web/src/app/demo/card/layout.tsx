import { DemoInteractionsHost } from '@/components/interactions/demo-interactions-host';

/**
 * Public-profile demo shell — ContentOpeningProvider (overlay lazy) for
 * project/research openings. Kept separate from the workspace sidebar layout.
 */
export default function DemoCardLayout({ children }: { children: React.ReactNode }) {
  return <DemoInteractionsHost>{children}</DemoInteractionsHost>;
}
