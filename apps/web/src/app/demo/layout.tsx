import { ContentOpeningProvider } from '@/components/navigation/content-opening-transition';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <ContentOpeningProvider>{children}</ContentOpeningProvider>;
}
