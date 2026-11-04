# Changelog

All notable changes to VIRELUMA are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/). The release version lives in `VERSION`;
see [docs/deployment/releases.md](docs/deployment/releases.md).

## [Unreleased]

### Added

- Supabase schema (M2): people, role-based memberships, emergency contacts and details with
  visibility levels, revocable public identifiers, consent records, invitations, value-free audit
  logs, scan events and a sourced emergency-number registry. RLS on every table, privileged
  changes through RPCs, and a rate-limited public emergency resolver.
- pgTAP suites for grants, the cross-tenant role matrix and the resolver; CI runs them on an
  ephemeral local stack together with the accounts E2E.
- Account area in four languages: registration with email confirmation, sign-in, sign-out (local
  and on all devices), password reset and account-deletion requests. Enabled only in builds that
  have a backend configured.
- Domain permission matrix and auth port mirroring the database rules.

## [0.1.0] - 2026-11-04

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
  `main` with post-deploy verification, and automatic version-driven GitHub Releases.
- Architecture decision records, security, privacy, deployment and product documentation.
