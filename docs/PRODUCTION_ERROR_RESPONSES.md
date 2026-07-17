# Production error responses (WS11-T008)

## Public contract

Client-visible JSON errors use `{ error: string }` only — never `stack`, `details`, `hint`, SQL, table names, Stripe payloads, or raw exception messages.

| Kind | Typical status | Example message |
|------|----------------|-----------------|
| Validation | 422 | Zod field messages authored by CodeCard |
| Auth | 401 | `Unauthorized` |
| CSRF | 403 | `Forbidden` |
| Rate limit | 429 | `Too many requests` |
| Not found / conflict | 404 / 409 | Domain-authored strings |
| Unexpected | 500 | `Something went wrong. Please try again.` (`internalError`) |

## Central helpers

- `apiError` / `internalError` — `apps/web/src/lib/api-utils.ts`
- `secureJsonRoute` wraps handlers in try/catch → `internalError()` on unexpected throws
- Stripe webhook: opaque signature/processing errors (WS11-T011)
- Upload: authored messages via upload-failure helpers
- Mutation toasts: `sanitizeMutationError`

## Boundaries

- `apps/web/src/app/global-error.tsx` — opaque root recovery UI (no `error.message`)
- Profile segment `error.tsx` — safe load state

## Dead code removed

Legacy `create-project-action.ts` (raw PostgREST `.message`) deleted. Live create path: `app/actions/projects.ts` → `project-create-core` → `mapProjectCreateDbError`.

## Billing

Checkout/portal Stripe failures redirect to `/dashboard/billing?error=billing` without forwarding Stripe messages. `redirect()` stays outside the Stripe try/catch so Next control-flow is preserved.
