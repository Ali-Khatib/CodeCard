# CodeCard Security Checklist

Use this before every production deploy and before launch.

## Secrets & configuration

- [ ] No secrets in source code, git history, or test fixtures
- [ ] All secrets in environment variables or deployment secret manager
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is server-only (no `NEXT_PUBLIC_` prefix)
- [ ] `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-only
- [ ] `UPSTASH_REDIS_REST_TOKEN` is server-only
- [ ] `.env.local` is in `.gitignore` and not committed
- [ ] GitHub secret scanning and push protection enabled
- [ ] Dependabot alerts enabled and reviewed

## Database & auth

- [ ] RLS enabled on every table in `public` schema
- [ ] No table accessible without explicit policy
- [ ] Service role used only in server-side webhook/job handlers
- [ ] Client never receives service role key
- [ ] Auth user provisioning trigger tested
- [ ] JWT expiry configured appropriately (default 1 hour)

## Input validation

- [ ] Zod schemas on every API route and server action
- [ ] Body size limits enforced
- [ ] URL validation uses allowlist (HTTP/HTTPS only)
- [ ] Slug validation uses regex allowlist
- [ ] No mass assignment — explicit field allowlists on updates

## File uploads

- [ ] Extension allowlist enforced (jpg, png, webp, avif, pdf, mp4, webm)
- [ ] MIME type validated server-side
- [ ] Filenames replaced with UUIDs
- [ ] Size limits per file type enforced
- [ ] No SVG, HTML, or archive uploads in v1
- [ ] Storage buckets have appropriate RLS policies

## Rate limiting

- [ ] Auth endpoints rate limited (per IP)
- [ ] Analytics endpoints rate limited
- [ ] Upload endpoints rate limited (per user)
- [ ] Stripe webhook uses signature verification (not rate limit as primary defense)

## Payments

- [ ] Stripe webhook verifies signature with raw body
- [ ] Event IDs deduplicated in `billing_events`
- [ ] Subscription state synced from webhook, not client
- [ ] Customer portal used for self-serve cancellation

## AI safety (if enabled)

- [ ] User content treated as data, not instructions
- [ ] Structured prompts with explicit delimiters
- [ ] No secrets or policies in model context
- [ ] Model output validated before database writes
- [ ] Token/cost caps and rate limits on AI endpoints

## CI/CD

- [ ] CodeQL analysis runs on PRs
- [ ] Lint, typecheck, and tests are blocking
- [ ] Branch protection requires status checks
- [ ] No long-lived cloud credentials in GitHub Actions (prefer OIDC)

## Monitoring

- [ ] Sentry configured for web (and mobile when deployed)
- [ ] Error boundaries in place
- [ ] Audit logs for admin/billing/security actions

## Compliance

- [ ] Privacy policy matches actual data collection
- [ ] DMCA agent contact placeholder updated before launch
- [ ] Physical mailing address placeholder updated before launch
- [ ] Attorney review scheduled for launch jurisdictions
