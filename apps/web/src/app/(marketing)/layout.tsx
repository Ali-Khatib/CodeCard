import { AppShell } from '@/components/landing/app-shell';
import { GlobalBackdrop } from '@/components/landing/global-backdrop';
import { PublicRouteTransition } from '@/components/landing/public-route-transition';
import { ProjectOpenProvider } from '@/components/featured-work/project-open-overlay';
import { ContentOpeningProvider } from '@/components/navigation/content-opening-transition';
import { MotionPreferencesProvider } from '@/components/motion/motion-preferences-provider';
import { SmoothScrollProvider } from '@/components/motion/smooth-scroll-provider';
import { ThemeRoot } from '@/components/theme/theme-root';
import { DeferredVisitorConversionPrompt } from '@/components/visitor-conversion/deferred-visitor-conversion-prompt';

/**
 * Marketing shell — thin ContentOpeningProvider (lazy overlay) for internal
 * project/research openings. Lenis/GSAP boot after idle. Conversion deferred.
 * PublicRouteTransition only for landing → major public routes.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeRoot>
      <MotionPreferencesProvider>
        <SmoothScrollProvider enabled>
          <ContentOpeningProvider>
            <ProjectOpenProvider>
              <GlobalBackdrop />
              <PublicRouteTransition />
              <AppShell>{children}</AppShell>
              <DeferredVisitorConversionPrompt
                iosAppUrl={process.env.NEXT_PUBLIC_CODECARD_IOS_APP_URL}
                androidAppUrl={process.env.NEXT_PUBLIC_CODECARD_ANDROID_APP_URL}
              />
            </ProjectOpenProvider>
          </ContentOpeningProvider>
        </SmoothScrollProvider>
      </MotionPreferencesProvider>
    </ThemeRoot>
  );
}
