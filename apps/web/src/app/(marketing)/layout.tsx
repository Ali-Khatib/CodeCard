import { AppShell } from '@/components/landing/app-shell';
import { GlobalBackdrop } from '@/components/landing/global-backdrop';
import { ProjectOpenProvider } from '@/components/featured-work/project-open-overlay';
import { MotionPreferencesProvider } from '@/components/motion/motion-preferences-provider';
import { SmoothScrollProvider } from '@/components/motion/smooth-scroll-provider';
import { ThemeRoot } from '@/components/theme/theme-root';
import { DeferredVisitorConversionPrompt } from '@/components/visitor-conversion/deferred-visitor-conversion-prompt';

/**
 * Marketing shell — no ContentOpeningProvider (optional in featured-work).
 * ProjectOpenProvider is a thin context shell; motion underlay loads on open.
 * Smooth-scroll Lenis/GSAP boot after idle. Conversion prompt idle-deferred.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeRoot>
      <MotionPreferencesProvider>
        <SmoothScrollProvider enabled>
          <ProjectOpenProvider>
            <GlobalBackdrop />
            <AppShell>{children}</AppShell>
            <DeferredVisitorConversionPrompt
              iosAppUrl={process.env.NEXT_PUBLIC_CODECARD_IOS_APP_URL}
              androidAppUrl={process.env.NEXT_PUBLIC_CODECARD_ANDROID_APP_URL}
            />
          </ProjectOpenProvider>
        </SmoothScrollProvider>
      </MotionPreferencesProvider>
    </ThemeRoot>
  );
}
