/**
 * WS08-T005 — Conservative server-side bot filtering for analytics ingestion.
 *
 * Reads User-Agent from request headers only (never from JSON body).
 * Does not persist user agents. Social-preview bots may still fetch public
 * HTML/Open Graph; only analytics recording is ignored.
 *
 * Empty/missing User-Agent is allowed (privacy-oriented clients).
 */

const OBVIOUS_BOT_UA_PATTERNS: readonly RegExp[] = [
  /googlebot/i,
  /bingbot/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandex(bot|images)/i,
  /slurp/i,
  /facebookexternalhit/i,
  /facebot/i,
  /twitterbot/i,
  /linkedinbot/i,
  /slackbot/i,
  /discordbot/i,
  /telegrambot/i,
  /applebot/i,
  /petalbot/i,
  /semrushbot/i,
  /ahrefsbot/i,
  /dotbot/i,
  /rogerbot/i,
  /mj12bot/i,
  /uptimerobot/i,
  /pingdom/i,
  /statuscake/i,
  /monitor/i,
  /bot/i,
  /crawler/i,
  /spider/i,
  /headlesschrome/i,
];

export function isObviousAnalyticsBot(userAgent: string | null | undefined): boolean {
  if (userAgent == null) return false;
  const ua = userAgent.trim();
  if (!ua) return false;
  return OBVIOUS_BOT_UA_PATTERNS.some((pattern) => pattern.test(ua));
}

/** Drop client-supplied UA-like keys; never persist full user agents from analytics payloads. */
export function sanitizeAnalyticsMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!metadata) return {};
  const blocked = new Set([
    'user_agent',
    'userAgent',
    'user-agent',
    'ua',
    'navigator_user_agent',
  ]);
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (blocked.has(key)) continue;
    clean[key] = value;
  }
  return clean;
}
