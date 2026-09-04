import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Instrument_Serif, Inter, Orbitron, Share_Tech_Mono, Space_Mono } from 'next/font/google';
import { SkipToContentLink } from '@/components/a11y/skip-to-content';
import { AuthHashRecoveryCatcher } from '@/components/auth/auth-hash-recovery-catcher';
import { DeferredVercelTelemetry } from '@/components/telemetry/deferred-vercel-telemetry';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  // Optional: if Inter is not ready quickly, keep metrics-matched fallback and
  // avoid a late text LCP update from webfont swap (WS14-T019).
  display: 'optional',
  adjustFontFallback: true,
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument',
  subsets: ['latin'],
  weight: '400',
  // Landing `/` LCP is this face. optional avoids a late webfont swap updating LCP.
  display: 'optional',
  preload: true,
  adjustFontFallback: true,
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
  twitter: {
    card: 'summary_large_image',
  },
};

export const viewport: Viewport = {
  themeColor: '#fcf1e7',
  width: 'device-width',
  initialScale: 1,
};

/** Same-origin theme tokens. Kept as a static file so CSP need not hash this boot. */
const THEME_BOOT_SRC = '/theme-boot.js';

/**
 * Root layout stays free of ThemeRoot / ProjectOpenProvider / conversion prompt
 * so `/[slug]` public profiles are not forced through heavy client islands before
 * ATF paint (WS14-T019). Themed shells + conversion live in marketing/dashboard/admin.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="original" suppressHydrationWarning>
      <head>
        <Script src={THEME_BOOT_SRC} strategy="beforeInteractive" />
      </head>
      <body
        className={`${inter.variable} ${instrumentSerif.variable} ${spaceMono.variable} ${orbitron.variable} ${shareTechMono.variable} min-h-screen bg-bone font-sans text-ink antialiased`}
        style={{
          '--font-sans': 'var(--font-inter), system-ui, sans-serif',
          '--font-display': 'var(--font-instrument), Georgia, ui-serif, serif',
          '--font-eyebrow': 'var(--font-space-mono), ui-monospace, monospace',
        } as Record<string, string>}
      >
        <SkipToContentLink />
        <AuthHashRecoveryCatcher />
        {children}
        <DeferredVercelTelemetry />
      </body>
    </html>
  );
}
