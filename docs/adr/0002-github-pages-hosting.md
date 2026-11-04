# ADR-0002 — GitHub Pages as initial hosting, and its exit path

- Status: Accepted · 2026-11-04

## Context

The owner wants an economical start at `https://wembie.github.io/vireluma/` with no custom domain
yet. GitHub Pages is static hosting only.

## What GitHub Pages cannot do (and we must not pretend it does)

- No server-side code, no SSR, no secrets, no database transactions.
- No custom response headers: no `Content-Security-Policy`, `Strict-Transport-Security`
  customisation, `X-Frame-Options` or cache-control rules. Some can be approximated with
  `<meta>` (referrer policy, CSP partially); `frame-ancestors` cannot.
- One site per repository → no hosted `dev` environment (ADR-0003).
- On a project site, `robots.txt` at `/vireluma/robots.txt` is **not** read by crawlers (they only
  read the host root, which we do not control). Indexing is therefore enforced per page with
  `<meta name="robots">`; the sitemap is discoverable via Search Console.
- Unknown paths are served `404.html` with HTTP 404; no rewrites or redirects.
- Usage limits (per GitHub docs at time of writing): 1 GB published site, soft 100 GB/month
  bandwidth, and GitHub Pages is not intended for commercial/SaaS hosting. Not a fit for a
  high-traffic production emergency service. Re-check the current limits before relying on them.

## Decision

1. GitHub Pages hosts the static site from `main`, deployed with the official
   `actions/upload-pages-artifact` + `actions/deploy-pages` workflow.
2. Dynamic data (from M2) is fetched client-side from Supabase (ADR-0006). Emergency profiles are
   never generated at build time.
3. Origin and base path are configuration (`apps/web/site.config.ts`, env vars), consumed only
   through the domain `UrlService`. No hardcoded `github.io` URLs in application code.
4. **No permanent commercial QR codes are issued while on `github.io`.** QR/NFC printed during
   this phase are test artefacts.

## Exit path (trigger: custom domain purchase, need for headers/edge logic, or traffic)

Cloudflare Pages + Workers (or another edge/SSR host) in front of a custom domain:
security headers and CSP, edge rate limiting for the emergency resolver, cached
`robots.txt` at the domain root, optional SSR for the emergency page. Procedure:
[docs/deployment/custom-domain-migration.md](../deployment/custom-domain-migration.md).

## Consequences

- Security headers are a known gap until migration (tracked in the threat model).
- Static rendering is used for marketing SEO; there is **no** SEO for profiles by design.
