import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

/** Sentry ingest + tunnel (WS14-T015). */
const sentryConnect =
  'https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io';

/**
 * CSP exceptions (do not tighten blindly — these are required for current dependencies):
 * - 'unsafe-inline' on script-src: REQUIRED — Next.js hydration / bootstrap; Vercel insights
 * - 'unsafe-eval' on script-src: REQUIRED today — Three.js/WebGL shader compile + animation
 *   (GSAP is used on marketing/profile). Do not drop without a production browser pass.
 * - Theme boot is `/theme-boot.js` (same-origin), not an inline script.
 * - va.vercel-scripts.com / vitals.vercel-insights.com: Vercel Analytics + Speed Insights
 * - *.supabase.co: Auth, DB, Storage, Realtime
 * - ingest.sentry.io: error monitoring (also tunneled via /monitoring)
 * QR images are generated locally (`qrcode`); do not allow a third-party QR image host.
 */
function contentSecurityPolicy(frameAncestors: "'none'" | "'self'"): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com",
    "media-src 'self' blob: https://cdn.coverr.co",
    "font-src 'self' data:",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com ${sentryConnect}`,
    `frame-ancestors ${frameAncestors}`,
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=(), browsing-topics=()' },
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy("'none'"),
  },
];

const previewSecurityHeaders = securityHeaders.map((header) => {
  if (header.key === 'X-Frame-Options') {
    return { key: 'X-Frame-Options', value: 'SAMEORIGIN' };
  }
  if (header.key === 'Content-Security-Policy') {
    return { key: 'Content-Security-Policy', value: contentSecurityPolicy("'self'") };
  }
  return header;
});

const nextConfig: NextConfig = {
  // Tests may isolate build artifacts from a concurrently running local dev server.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  /**
   * WS11-T007: Server Action CSRF.
   * Next.js compares Origin to Host / X-Forwarded-Host (Vercel).
   * `allowedOrigins` lists extra reverse-proxy hostnames that may bypass that check.
   * Keep empty for direct Vercel deploys — never use wildcards.
   *
   * WS11-T002: `authInterrupts` enables `forbidden()` so `/admin` returns a real HTTP 403
   * (app/forbidden.tsx) instead of a 200 "access denied" page.
   */
  experimental: {
    serverActions: {
      allowedOrigins: [],
    },
    authInterrupts: true,
  },
  transpilePackages: [
    '@codecard/ui',
    '@codecard/types',
    '@codecard/validation',
    '@codecard/config',
    '@codecard/analytics',
    '@paper-design/shaders-react',
    '@paper-design/shaders',
  ],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glb|gltf)$/i,
      type: 'asset/resource',
    });
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  async headers() {
    return [
      {
        // Matching header sources merge. Two CSPs AND together, so preview
        // routes must be excluded from the global DENY / frame-ancestors none set.
        source: '/((?!demo(?:/|$)|dashboard/preview(?:/|$)).*)',
        headers: securityHeaders,
      },
      { source: '/demo', headers: previewSecurityHeaders },
      { source: '/demo/:path*', headers: previewSecurityHeaders },
      { source: '/dashboard/preview', headers: previewSecurityHeaders },
      { source: '/dashboard/preview/:path*', headers: previewSecurityHeaders },
    ];
  },
  async redirects() {
    return [
      {
        // Legacy public project detail URLs (exclude workspace /projects/new).
        source: '/demo/projects/:id((?!new$)[^/]+)',
        destination: '/demo/card/projects/:id',
        permanent: true,
      },
      {
        source: '/demo/research/:slug((?!new$)[^/]+)',
        destination: '/demo/card/research/:slug',
        permanent: true,
      },
      {
        source: '/privacy',
        destination: '/legal/privacy',
        permanent: true,
      },
      {
        source: '/terms',
        destination: '/legal/terms',
        permanent: true,
      },
      {
        source: '/copyright',
        destination: '/legal/dmca',
        permanent: true,
      },
      {
        source: '/cookies',
        destination: '/legal/cookies',
        permanent: true,
      },
      {
        source: '/security',
        destination: '/legal/security',
        permanent: true,
      },
    ];
  },
};

/**
 * WS14-T015 — wrap with Sentry. Source-map upload stays off unless
 * `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are all set in CI/build.
 * Auth token is build-only and must never be NEXT_PUBLIC_.
 */
const sentryBuildEnabled = Boolean(
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT,
);

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: false,
  tunnelRoute: '/monitoring',
  sourcemaps: {
    disable: !sentryBuildEnabled,
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: false,
  },
});
