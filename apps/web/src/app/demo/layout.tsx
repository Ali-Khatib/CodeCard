import { DeferredVisitorConversionPrompt } from '@/components/visitor-conversion/deferred-visitor-conversion-prompt';

/**
 * Demo profile shell — no ContentOpeningProvider on the LCP route.
 * Opening transitions live under demo/projects and demo/research layouts.
 * App-system CSS is imported here (not in root globals) for public-profile styles.
 */
import '@/styles/codecard-app-system.css';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <DeferredVisitorConversionPrompt
        iosAppUrl={process.env.NEXT_PUBLIC_CODECARD_IOS_APP_URL}
        androidAppUrl={process.env.NEXT_PUBLIC_CODECARD_ANDROID_APP_URL}
      />
    </>
  );
}
