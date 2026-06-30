import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Inter, Space_Mono } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GlobalBackdrop } from '@/components/landing/global-backdrop';
import { ProjectOpenProvider } from '@/components/featured-work/project-open-overlay';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
});

const spaceMono = Space_Mono({
  variable: '--font-eyebrow',
  subsets: ['latin'],
  weight: ['400'],
});

export const metadata: Metadata = {
  title: {
    default: 'CodeCard | Share what you build',
    template: '%s | CodeCard',
  },
  description:
    'The modern identity for people who build things. In 30 seconds: who you are, and what you\'ve built. Everything else comes later.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: 'CodeCard',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a13',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${instrumentSerif.variable} ${spaceMono.variable} min-h-screen bg-obsidian antialiased`}
      >
        <GlobalBackdrop />
        <ProjectOpenProvider>{children}</ProjectOpenProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
