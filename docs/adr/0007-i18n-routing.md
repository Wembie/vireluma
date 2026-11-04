# ADR-0007 — Internationalised routing with localized slugs

- Status: Accepted · 2026-11-04

## Decision

- Locales: `es` (default, launch market Colombia), `en`, `pt`, `fr`. Every page lives under a
  locale prefix: `/es/`, `/en/`, `/pt/`, `/fr/`.
- Slugs are localized where natural (`/es/como-funciona/`, `/en/how-it-works/`,
  `/fr/comment-ca-marche/`). The single source is `apps/web/src/i18n/routes.ts`; pages are
  generated from it, and hreflang/sitemap alternates are derived from it (the sitemap
  integration's same-path assumption is replaced by a custom `serialize`).
- `hreflang` uses language-only tags; content is not region-specific. `x-default` points to the
  root language chooser for the home page and to the English page elsewhere.
- The root `/` is a language chooser, not a redirect (crawlers and users always reach content).
  A script highlights the browser's language without forcing it.
- Dictionaries are typed: Spanish is the source; other locales must match its shape (TypeScript)
  and its keys/list lengths (unit test). No string concatenation for sentences; components never
  mix languages.
- Trailing slashes always (`trailingSlash: 'always'`, directory build) to match GitHub Pages'
  canonical behaviour.

## Consequences

- Changing a published slug requires a redirect page and a sitemap update.
- Emergency-critical strings need native-speaker review before launch
  ([internationalization.md](../product/internationalization.md)).
