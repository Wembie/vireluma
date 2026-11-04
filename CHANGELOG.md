# Changelog

All notable changes to VIRELUMA are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/). The release version lives in `VERSION`;
see [docs/deployment/releases.md](docs/deployment/releases.md).

## [0.1.0]

### Added

- Monorepo foundation: pnpm workspaces, strict TypeScript, ESLint, Prettier, Vitest, Playwright,
  Conventional Commits (commitlint + lefthook) and a pinned Node 24 LTS runtime.
- `@vireluma/domain`: centralised public URL service, opaque 130-bit public profile identifiers
  (Crockford base32), locale negotiation and WCAG contrast utilities.
- VIRELUMA brand identity: original symbol, wordmark, lockups, monochrome and reversed variants,
  favicons, app icons and social preview, generated from a single geometry source.
- Design tokens (light and dark, verified WCAG 2.2 AA) and the first design-system components with a
  living showcase at `/design-system/`.
- Static, internationalised public website (es, en, pt, fr) with localized slugs, hreflang,
  canonical URLs, structured data, sitemap and privacy-first indexing rules.
- GitHub Actions: CI for `dev` and `main`, CodeQL, secret scanning, GitHub Pages deployment from
  `main` with post-deploy verification, and a controlled release workflow.
- Architecture decision records, security, privacy, deployment and product documentation.
