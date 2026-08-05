import { GlobalBackdrop } from '@/components/landing/global-backdrop';
import { ProjectOpenProvider } from '@/components/featured-work/project-open-overlay';
import { ContentOpeningProvider } from '@/components/navigation/content-opening-transition';
import { ThemeRoot } from '@/components/theme/theme-root';
import { DeferredVisitorConversionPrompt } from '@/components/visitor-conversion/deferred-visitor-conversion-prompt';
import '@/styles/codecard-app-system.css';

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
          <DeferredVisitorConversionPrompt
            iosAppUrl={process.env.NEXT_PUBLIC_CODECARD_IOS_APP_URL}
            androidAppUrl={process.env.NEXT_PUBLIC_CODECARD_ANDROID_APP_URL}
          />
        </ProjectOpenProvider>
      </ContentOpeningProvider>
    </ThemeRoot>
  );
}
