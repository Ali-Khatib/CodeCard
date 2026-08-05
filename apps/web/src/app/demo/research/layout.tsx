import { ContentOpeningProvider } from '@/components/navigation/content-opening-transition';

/** Research detail under /demo needs the opening transition host. */
export default function DemoResearchLayout({ children }: { children: React.ReactNode }) {
  return <ContentOpeningProvider>{children}</ContentOpeningProvider>;
}
