# ADR-0004 — Permanent profile URL format

- Status: Accepted · 2026-11-04

## Context

QR codes and NFC tags are printed and worn for years. Their URL must survive edits, redesigns,
redeploys, schema changes and a host/domain migration. It must contain no personal data and work
on static hosting (ADR-0002), where individual profile pages cannot be pre-generated.

## Options evaluated

| Option                     | Static host                                  | Privacy                                               | Robustness                                            |
| -------------------------- | -------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| **A. `/p/#ID` (fragment)** | One static page, HTTP 200                    | ID never sent to the host, not in logs or `Referer`   | Works anywhere; a few scanners may drop fragments     |
| B. `/p/?id=ID` (query)     | One static page, HTTP 200                    | ID in host/CDN logs; `Referer` leak unless suppressed | Very robust                                           |
| C. `/p/ID` via `404.html`  | Served by the 404 fallback with **HTTP 404** | ID in logs and `Referer`                              | Extra hop; some clients/previews treat 404 as failure |

## Decision

**Canonical form: `{origin}{basePath}/p/#{ID}`** (option A). The resolver page also accepts
`?id=` as a fallback (`readProfileIdFromLocation` in `@vireluma/domain`). The ID is sent to the
backend only in a POST body (M3), so it does not appear in access logs either.

The path `/p/` is part of the permanent contract and must never be renamed. Any future host must
keep serving `/p/` and honour both the fragment and `?id=` forms. A server/edge host may
additionally support `/p/{ID}` as an alias, but printed codes keep the fragment form.

## Consequences

- `/p/` is `noindex`, excluded from sitemaps and robots-disallowed (defence in depth).
- URL stability is tested: identical path/fragment across origins (`urls.test.ts`), and from M3
  across profile edits and redeploys (E2E).
- Direct navigation, refresh, deep links and back/forward work because the page is a real file;
  the client reads `location.hash` and listens to `hashchange`.
