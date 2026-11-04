# Custom domain migration

Goal: move from `https://wembie.github.io/vireluma/` to a permanent domain (e.g.
`https://example.org/`) **without changing application code** and before issuing commercial QR
codes.

## What changes

| Item                    | GitHub Pages today         | Custom domain               |
| ----------------------- | -------------------------- | --------------------------- |
| `PUBLIC_SITE_ORIGIN`    | `https://wembie.github.io` | `https://example.org`       |
| `PUBLIC_BASE_PATH`      | `/vireluma`                | `/`                         |
| Profile URL             | `…/vireluma/p/#ID`         | `https://example.org/p/#ID` |
| Identifiers, DB records | unchanged                  | unchanged                   |

The route `/p/` and identifier format are identical on both (`urls.test.ts` enforces this).

## Steps

1. Buy the domain; verify it in GitHub (Settings → Pages → Verified domains) to prevent takeover.
2. Decide the host: GitHub Pages with custom domain (quick) or Cloudflare Pages/Workers
   (recommended: security headers, CSP, edge rate limiting, root `robots.txt`) — ADR-0002.
3. Set repository variables `PUBLIC_SITE_ORIGIN` and `PUBLIC_BASE_PATH`; for GitHub Pages add the
   domain in Settings → Pages (HTTPS enforced). Configure DNS per the provider.
4. Build and run the full test suite against the new values locally:
   `PUBLIC_SITE_ORIGIN=https://example.org PUBLIC_BASE_PATH=/ pnpm build && pnpm check:seo && pnpm e2e`.
5. **Keep old URLs working**: test QR codes printed with `wembie.github.io/vireluma/p/#ID` must
   keep resolving. Options: keep a minimal redirect site in this repository's Pages (a `p/`
   page that forwards `location.hash` to the new origin, plus a generic redirect for other
   paths), or keep serving the full site at both origins with canonical tags pointing to the new
   domain.
6. Test the migration before switching the canonical origin: scan old and new QR codes on iOS and
   Android, refresh/deep-link/back-forward on `/p/`, verify hreflang/canonical/sitemap.
7. Update Search Console (new property, sitemap) and use the change-of-address flow if applicable.
8. Only now start issuing **permanent** QR/NFC codes on the new origin.
