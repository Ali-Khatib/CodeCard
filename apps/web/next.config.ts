import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

/** Sentry ingest + tunnel (WS14-T015). */
const sentryConnect =
  'https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io';

const previewEmbedCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://api.qrserver.com",
  "media-src 'self' blob: https://cdn.coverr.co",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://api.qrserver.com ${sentryConnect}`,
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://api.qrserver.com",
      "media-src 'self' blob: https://cdn.coverr.co",
      "font-src 'self' data:",
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://api.qrserver.com ${sentryConnect}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  // Tests may isolate build artifacts from a concurrently running local dev server.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  eslint: {
    ignoreDuringBuilds: true,
  },
  /**
   * WS11-T007: Server Action CSRF.
   * Next.js compares Origin to Host / X-Forwarded-Host (Vercel).
   * `allowedOrigins` lists extra reverse-proxy hostnames that may bypass that check.
   * Keep empty for direct Vercel deploys — never use wildcards.
   */
  experimental: {
    serverActions: {
      allowedOrigins: [],
    },
    /**
     * WS11-T002: enables `forbidden()` so the `/admin` gate can return a
     * real HTTP 403 (app/forbidden.tsx) instead of a 200 "access denied" page.
     */
    authInterrupts: true,
  },
  transpilePackages: [
    '@codecard/ui',
    '@codecard/types',
    '@codecard/validation',
    '@codecard/config',
    '@codecard/analytics',
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
    const previewEmbedHeaders = [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Content-Security-Policy', value: previewEmbedCsp },
    ];
    return [
      { source: '/(.*)', headers: securityHeaders },
      { source: '/dashboard/preview', headers: previewEmbedHeaders },
      { source: '/dashboard/preview/:path*', headers: previewEmbedHeaders },
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
