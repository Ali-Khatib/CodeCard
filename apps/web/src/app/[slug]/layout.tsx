import { ContentOpeningProvider } from '@/components/navigation/content-opening-transition';

/** Public profile + project/research detail routes share the opening transition host. */
export default function PublicSlugLayout({ children }: { children: React.ReactNode }) {
  return <ContentOpeningProvider>{children}</ContentOpeningProvider>;
}
