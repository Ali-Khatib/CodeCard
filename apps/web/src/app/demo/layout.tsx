import { Suspense } from 'react';
import { ContentOpeningProvider } from '@/components/navigation/content-opening-transition';
import { SitewideVisitorConversionPrompt } from '@/components/visitor-conversion/sitewide-visitor-conversion-prompt';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <ContentOpeningProvider>
      {children}
      <Suspense fallback={null}>
        <SitewideVisitorConversionPrompt
          iosAppUrl={process.env.NEXT_PUBLIC_CODECARD_IOS_APP_URL}
          androidAppUrl={process.env.NEXT_PUBLIC_CODECARD_ANDROID_APP_URL}
        />
      </Suspense>
    </ContentOpeningProvider>
  );
}
