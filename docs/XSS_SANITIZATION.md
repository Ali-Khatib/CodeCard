# XSS and unsafe-content rendering (WS11-T006)

CodeCard renders user-controlled content as **plain React text**. There is no approved rich-text / Markdown HTML pipeline for UGC.

**Circle is a private latest-work feed, not a social engagement platform.** Circle previews use the same plain-text and safe-href rules as public work cards.

---

## Dangerous sinks

| Sink | Location | Status |
|---|---|---|
| `dangerouslySetInnerHTML` | `app/layout.tsx` (`THEME_BOOT_SCRIPT`) | Trusted static boot script only |
| `dangerouslySetInnerHTML` | `components/ui/chart.tsx` | CSS variables from chart config IDs/colors — not UGC |
| Markdown / MDX / DOMPurify | — | Not used |
| `.innerHTML` assignments | — | Not used |

---

## URL protocol policy

Allow via shared helpers (`safe-href`, profile/project link validators):

- `https:` / `http:` for general external links
- `mailto:` for approved profile email links
- DOI / external PDF HTTPS only

Reject: `javascript:`, `vbscript:`, unsafe `data:`, protocol-relative `//`, control-character prefixes, embedded credentials.

External anchors use `rel="noopener noreferrer"`.

Research PDF reader: paper-ID lookup + SSRF-hardened HTTPS proxy — never arbitrary URL proxying.

---

## Upload content

- Live uploads: JPEG/PNG/WebP only (avatars, project media)
- SVG / HTML / script MIME types rejected
- Filenames and captions rendered as text

---

## Payload corpus

`PUBLIC_XSS_PAYLOADS` in `apps/web/src/lib/security/safe-href.ts` — expanded in WS11-T006.

Tests: `public-xss-audit.test.ts`, `xss-sanitization-audit.contract.test.ts`, Playwright `e2e/xss-public.spec.ts`.

---

## Private notes

Connection private notes remain owner-only (RLS + IDOR) and are rendered as plain text without HTML sinks.
