import { Suspense } from 'react';
import { GlobalBackdrop } from '@/components/landing/global-backdrop';
import { ProjectOpenProvider } from '@/components/featured-work/project-open-overlay';
import { ContentOpeningProvider } from '@/components/navigation/content-opening-transition';
import { ThemeRoot } from '@/components/theme/theme-root';
import { SitewideVisitorConversionPrompt } from '@/components/visitor-conversion/sitewide-visitor-conversion-prompt';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeRoot>
      <ContentOpeningProvider>
        <ProjectOpenProvider>
          <GlobalBackdrop />
          {children}
          <Suspense fallback={null}>
            <SitewideVisitorConversionPrompt
              iosAppUrl={process.env.NEXT_PUBLIC_CODECARD_IOS_APP_URL}
              androidAppUrl={process.env.NEXT_PUBLIC_CODECARD_ANDROID_APP_URL}
            />
          </Suspense>
        </ProjectOpenProvider>
      </ContentOpeningProvider>
    </ThemeRoot>
  );
}
