import { DeferredVisitorConversionPrompt } from '@/components/visitor-conversion/deferred-visitor-conversion-prompt';

/**
 * Demo shell — shared app-system CSS for workspace + public profile.
 * Visitor conversion eligibility is limited to `/demo` (workspace entry).
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
