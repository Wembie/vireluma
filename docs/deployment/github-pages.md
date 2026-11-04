# Deploying to GitHub Pages

Production URL: **https://wembie.github.io/vireluma/** (project site; base path `/vireluma`).
Limitations and exit path: [ADR-0002](../adr/0002-github-pages-hosting.md).

## How a deployment happens

1. A PR from `dev` into `main` passes all required checks (`ci.yml`, `security.yml`,
   `pr-hygiene.yml`).
2. Merging pushes to `main` and triggers `.github/workflows/deploy-pages.yml`:
   - **guard** refuses any ref other than `main`;
   - **build** runs `check:version`, unit tests, a `production` build, the SEO check and bundle
     budgets, verifies `dist/version.json` carries the commit SHA, then uploads the Pages artifact
     (retained 30 days);
   - **deploy** publishes with `actions/deploy-pages` into the `github-pages` environment;
   - **verify** polls `https://wembie.github.io/vireluma/version.json` until it serves the
     deployed SHA, then smoke-tests key URLs.
3. A deployment is only "successful" when **verify** passes.

Manual re-deploy: Actions → _Deploy to GitHub Pages_ → Run workflow (branch `main`).

## Base path handling

- `site.config.ts` reads `PUBLIC_SITE_ORIGIN` and `PUBLIC_BASE_PATH`; Astro receives them as
  `site` and `base`.
- All links, assets, canonical URLs, sitemap entries and QR targets are produced by the domain
  `UrlService` (`apps/web/src/config/site.ts`). Never write `/vireluma/` or `github.io` in code.
- E2E tests run against `astro preview` under `/vireluma/`, exercising the same paths as Pages.
- `404.html` is served by Pages for unknown URLs (HTTP 404), in all four languages, `noindex`.

## Search Console (after the first production deploy)

1. Add a **URL-prefix property** for `https://wembie.github.io/vireluma/`.
2. Verify ownership with the **HTML tag** method: copy only the `content` token and save it as
   repository variable `PUBLIC_GOOGLE_SITE_VERIFICATION`, then redeploy. Production builds emit
   `<meta name="google-site-verification">`; other builds never do.
3. Submit `https://wembie.github.io/vireluma/sitemap-index.xml`.
4. Remember: crawlers ignore `/vireluma/robots.txt` on a project site; indexing rules rely on
   per-page `<meta name="robots">`.

## Local verification

```bash
pnpm build && pnpm check:seo && pnpm check:bundle
pnpm preview            # http://localhost:4321/vireluma/
pnpm e2e
```
