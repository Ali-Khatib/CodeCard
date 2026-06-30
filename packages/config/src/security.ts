export const BODY_LIMITS = {
  json: 64 * 1024, // 64 KB
  upload: 50 * 1024 * 1024, // 50 MB (enforced again at storage)
  webhook: 256 * 1024, // 256 KB Stripe payloads
} as const;

export const AI_DELIMITERS = {
  system: '<<<SYSTEM_INSTRUCTIONS>>>',
  userData: '<<<USER_DATA>>>',
  end: '<<<END>>>',
} as const;
