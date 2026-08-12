# CI security auditing (WS11-T009)

Blocking security controls for secrets and dependency vulnerabilities.

## Package manager

- Manager: **npm** (`packageManager`: `npm@10.9.0`)
- Lockfile: root `package-lock.json` (workspaces: `apps/*`, `packages/*`)
- One root audit covers the full monorepo lockfile; do not run contradictory per-package audits against the same lockfile.

## Secret scanning

| Control | Detail |
|---------|--------|
| Tool | Custom scanner `scripts/check-secrets.js` via `npm run security:scan` |
| Scope | Repository working tree (application sources under `apps/`, `packages/`, docs, SQL, configs) |
| CI job | `secret-scan` in `.github/workflows/ci.yml` |
| Blocking | Yes — nonzero exit fails the job |
| Extra | Grep for hardcoded Stripe `sk_live_` / `sk_test_` under `apps/` and `packages/` |

Allowlists are pattern-specific in `scripts/check-secrets.js`:

- Example env files may contain JWT-shaped placeholders.
- Test fixtures may contain password-assignment strings.
- `lib/security/env` documents forbidden `NEXT_PUBLIC_` prefixes.
- `*.test.*` / `*.spec.*` / `*.contract.test.*` files may assert that forbidden `NEXT_PUBLIC_` prefixes must not appear in application sources (e.g. billing regression tests).

Do not broadly exclude application directories. Never allowlist a real credential.

## Dependency vulnerability audit

| Control | Detail |
|---------|--------|
| Tool | `npm audit` |
| Command | `npm run security:audit` → `node scripts/security-audit.mjs` (wraps `npm audit --audit-level=high --package-lock-only --json`) |
| Lockfile | Root `package-lock.json` only (`--package-lock-only`) |
| Severity threshold | **Fail on high and critical**. Moderate/low are reported by `npm audit` but do not fail CI at this threshold. |
| CI job | `dependency-audit` (runs after `npm ci`) |
| Blocking | Yes — no `continue-on-error`, no `\|\| true` |

Development tooling vulnerabilities that reach build/test tooling or deployed bundles are still in scope when npm classifies them at high/critical under the root lockfile.

### Justified exceptions

Documented in `scripts/security-audit.mjs` (`EXCEPTIONS`) and enforced with an expiry date. Renew or remove before expiry — expired exceptions fail CI.

| GHSA | Package | Reason | Owner | Expires |
|------|---------|--------|-------|---------|
| `GHSA-w3rx-r6r6-pgpr` | `image-size` | No fixed release yet (range includes latest `2.0.2`). Reachable only via Expo/Metro mobile tooling, not the web runtime. | platform | 2026-09-30 |
| `GHSA-5p2g-fcmc-qvqq` | `image-size` | No fixed release yet (range includes latest `2.0.2`). Reachable only via Expo/Metro mobile tooling, not the web runtime. | platform | 2026-09-30 |

Root `package.json` `overrides` force patched `postcss`, `sharp`, and `brace-expansion` into Next/ESLint trees where possible.

Never silence the audit step itself.

## Workflow permissions

Security jobs use `permissions: contents: read` only. They do not receive deployment, Supabase, or Stripe secrets. Untrusted PR code cannot access production credentials through these jobs.

## Branches

CI (including security jobs) runs on pushes and pull requests targeting `main` and `mvp`.
