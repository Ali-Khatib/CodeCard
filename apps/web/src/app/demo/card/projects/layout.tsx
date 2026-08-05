import { ContentOpeningProvider } from '@/components/navigation/content-opening-transition';

/** Project detail under /demo needs the opening transition host. */
export default function DemoProjectsLayout({ children }: { children: React.ReactNode }) {
  return <ContentOpeningProvider>{children}</ContentOpeningProvider>;
}
