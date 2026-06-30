# CodeCard Launch Checklist

## Product readiness

- [ ] Landing page live with clear value proposition
- [ ] Sign-up / sign-in flow tested end-to-end
- [ ] Public profile renders fast on mobile (< 3s LCP target)
- [ ] Project CRUD and publish/unpublish working
- [ ] Profile slug customization working
- [ ] Demo profile available at `/demo`
- [ ] Stripe checkout and webhook tested in staging
- [ ] Customer portal cancellation tested
- [ ] Mobile app sign-in and saved connections tested

## Infrastructure

- [ ] Vercel production deploy configured
- [ ] Supabase production project provisioned
- [ ] Database migrations applied to production
- [ ] Storage buckets created with RLS policies
- [ ] Environment variables set in Vercel
- [ ] Stripe webhook endpoint registered
- [ ] Upstash Redis provisioned
- [ ] Sentry project configured
- [ ] Custom domain configured (if applicable)

## Legal & compliance

- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Acceptable Use Policy published
- [ ] DMCA Policy published with designated agent
- [ ] Contact page with valid email addresses
- [ ] DMCA physical address updated (placeholder removed)
- [ ] CAN-SPAM compliance for any marketing email
- [ ] Attorney review completed

## Security

- [ ] All items in SECURITY_CHECKLIST.md completed
- [ ] Penetration test or security review (recommended)
- [ ] RLS policies tested with unauthorized access attempts

## Analytics & monitoring

- [ ] Profile view tracking working
- [ ] Project view tracking working
- [ ] Owner analytics dashboard showing data
- [ ] Sentry receiving errors
- [ ] Vercel Speed Insights enabled

## Mobile (v1 companion scope)

- [ ] Expo app builds via EAS
- [ ] No in-app subscription purchase flow
- [ ] App store listing describes web-based billing
- [ ] Sign-in, saved connections, notes accessible

## Post-launch

- [ ] Monitor error rates for 48 hours
- [ ] Monitor Stripe webhook delivery
- [ ] Respond to first user feedback
- [ ] Document known limitations and v2 roadmap

## Explicitly NOT in v1

- Public comments
- Messaging
- Recruiter CRM
- Marketplace
- In-app subscription purchases
- Transparent alpha hero video
- AI generation (unless separately launched with safety review)
