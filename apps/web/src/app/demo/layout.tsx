import { DeferredVisitorConversionPrompt } from '@/components/visitor-conversion/deferred-visitor-conversion-prompt';
import { DemoInteractionsHost } from '@/components/interactions/demo-interactions-host';

/**
 * Demo profile shell — thin ContentOpeningProvider (overlay lazy) for project/research
 * openings from the profile page. App-system CSS is route-split here.
 */
import '@/styles/codecard-app-system.css';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoInteractionsHost>
      {children}
      <DeferredVisitorConversionPrompt
        iosAppUrl={process.env.NEXT_PUBLIC_CODECARD_IOS_APP_URL}
        androidAppUrl={process.env.NEXT_PUBLIC_CODECARD_ANDROID_APP_URL}
      />
    </DemoInteractionsHost>
  );
}
