import { Suspense } from 'react';
import { AppShell } from '@/components/landing/app-shell';
import { GlobalBackdrop } from '@/components/landing/global-backdrop';
import { ProjectOpenProvider } from '@/components/featured-work/project-open-overlay';
import { ThemeRoot } from '@/components/theme/theme-root';
import { SitewideVisitorConversionPrompt } from '@/components/visitor-conversion/sitewide-visitor-conversion-prompt';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeRoot>
      <ProjectOpenProvider>
        <GlobalBackdrop />
        <AppShell>{children}</AppShell>
        <Suspense fallback={null}>
          <SitewideVisitorConversionPrompt
            iosAppUrl={process.env.NEXT_PUBLIC_CODECARD_IOS_APP_URL}
            androidAppUrl={process.env.NEXT_PUBLIC_CODECARD_ANDROID_APP_URL}
          />
        </Suspense>
      </ProjectOpenProvider>
    </ThemeRoot>
  );
}
