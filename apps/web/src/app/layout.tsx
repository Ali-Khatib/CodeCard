import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Instrument_Serif, Inter, Orbitron, Share_Tech_Mono, Space_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SkipToContentLink } from '@/components/a11y/skip-to-content';
import { GlobalBackdrop } from '@/components/landing/global-backdrop';
import { ProjectOpenProvider } from '@/components/featured-work/project-open-overlay';
import { ThemeRoot } from '@/components/theme/theme-root';
import { SitewideVisitorConversionPrompt } from '@/components/visitor-conversion/sitewide-visitor-conversion-prompt';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument',
  subsets: ['latin'],
  weight: '400',
});

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  subsets: ['latin'],
  weight: ['400'],
  preload: false,
});

const orbitron = Orbitron({
  variable: '--font-cyber-display',
  subsets: ['latin'],
  weight: ['500', '700'],
  preload: false,
});

const shareTechMono = Share_Tech_Mono({
  variable: '--font-cyber-sans',
  subsets: ['latin'],
  weight: ['400'],
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: 'CodeCard | Quick showcase for your work',
    template: '%s | CodeCard',
  },
  description:
    "The fastest way to show someone what you're capable of. Your best work, ready to share by link, QR, or from your phone.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: 'CodeCard',
  },
};

export const viewport: Viewport = {
  themeColor: '#fcf1e7',
  width: 'device-width',
  initialScale: 1,
};

const THEME_BOOT_SCRIPT = `(function(){try{var r=document.documentElement;r.setAttribute('data-theme','original');localStorage.setItem('codecard-theme','original');if(localStorage.getItem('cc-app-appearance')==='dark')r.classList.add('dark');var v={'--bone':'#fcf1e7','--paper':'#ffffff','--ink':'#232324','--canvas':'#fcf1e7','--void-canvas':'#fcf1e7','--background':'#fcf1e7','--obsidian':'#fcf1e7','--cosmic-base-start':'#fcf1e7','--cosmic-base-mid':'#fafafa','--cosmic-base-end':'#fcf1e7','--text-primary':'#232324','--vellum':'#232324','--phosphor':'#232324','--text-secondary':'#767073','--smoke':'#767073','--iris':'#c094e4','--accent':'#c094e4','--accent-rgb':'192, 148, 228','--cosmic-glow':'rgba(195, 192, 242, 0.14)','--cosmic-glow-secondary':'rgba(241, 201, 221, 0.12)'};for(var k in v)r.style.setProperty(k,v[k]);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="original" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#fcf1e7" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body
        className={`${inter.variable} ${instrumentSerif.variable} ${spaceMono.variable} ${orbitron.variable} ${shareTechMono.variable} min-h-screen bg-bone font-sans text-ink antialiased`}
        style={{
          '--font-sans': 'var(--font-inter), system-ui, sans-serif',
          '--font-display': 'var(--font-instrument), Georgia, ui-serif, serif',
          '--font-eyebrow': 'var(--font-space-mono), ui-monospace, monospace',
        } as Record<string, string>}
      >
        <ThemeRoot>
          <SkipToContentLink />
          <GlobalBackdrop />
          <ProjectOpenProvider>{children}</ProjectOpenProvider>
          <Suspense fallback={null}>
            <SitewideVisitorConversionPrompt
              iosAppUrl={process.env.NEXT_PUBLIC_CODECARD_IOS_APP_URL}
              androidAppUrl={process.env.NEXT_PUBLIC_CODECARD_ANDROID_APP_URL}
            />
          </Suspense>
        </ThemeRoot>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
