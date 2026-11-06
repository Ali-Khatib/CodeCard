import { Geist, Geist_Mono } from 'next/font/google';
import { Cc2Shell } from '@/components/cc2/shell';
import { ProjectOpenProvider } from '@/components/featured-work/project-open-overlay';
import { ContentOpeningProvider } from '@/components/navigation/content-opening-transition';
import { MotionPreferencesProvider } from '@/components/motion/motion-preferences-provider';
import { SmoothScrollProvider } from '@/components/motion/smooth-scroll-provider';
import { ThemeRoot } from '@/components/theme/theme-root';
import { DeferredVisitorConversionPrompt } from '@/components/visitor-conversion/deferred-visitor-conversion-prompt';

const cc2Text = Geist({ subsets: ['latin'], variable: '--font-cc2-text', display: 'swap' });
const cc2Mono = Geist_Mono({ subsets: ['latin'], variable: '--font-cc2-mono', display: 'swap' });

/**
 * Marketing shell. Cc2Shell owns the nav, footer and opening sequence.
 * Lenis boots after idle; conversion prompt stays deferred.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeRoot>
      <MotionPreferencesProvider>
        <SmoothScrollProvider enabled>
          <ContentOpeningProvider>
            <ProjectOpenProvider>
              <Cc2Shell fontClass={`${cc2Text.variable} ${cc2Mono.variable}`}>{children}</Cc2Shell>
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
