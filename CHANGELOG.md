# Changelog

All notable changes to VIRELUMA are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/). The release version lives in `VERSION`;
see [docs/deployment/releases.md](docs/deployment/releases.md).

## [Unreleased]

## [0.2.2] - 2026-11-04

### Fixed

- Public pages kept showing "Sign in" and "Create an account" to people who were already signed
  in. A session hint set before the first paint now shows "My account" in the header and "Go to my
  people" on the home page instead (display only; access is still enforced by the backend).

## [0.2.1] - 2026-11-04

Accounts, people management and emergency-code resolution are enabled on the public site as a
**beta** (owner decision). Legal documents are still pending legal review, the backend runs on the
Supabase Free plan without backups, and confirmation emails use Supabase's default sender until a
real email provider is configured.

### Added

- "Create an account" and "Sign in" entry points on the home page; production builds connect to the
  production backend.

### Changed

- Status banner and FAQ say "beta" instead of "not available yet", in four languages.
- The production deploy refuses to build without the backend configuration (or with a secret key)
  and its smoke test also checks the emergency page and the login page.
- CI retries the local Supabase start once when a runner port is already in use.

## [0.2.0] - 2026-11-04

Production note: accounts, people management and code resolution ship in the code but stay
disabled on the public site until a privacy notice (legal review) and a real email provider
exist. They are verified end to end against a local backend in CI.

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
- Core product (M3): dashboard of people, person creation with consent (setup resumes from
  server data on any device), editors for profile, emergency contacts (E.164 with a confirmation
  preview) and emergency details (private by default, health data gated by consent), ordering,
  identifier issue/replace/revoke, sharing by one-time invitation links bound to an email, role
  changes, ownership transfer, pause, deletion, and an activity view (scans and value-free audit).
- Public emergency page `/p/#ID`: about 3 KB of JavaScript, four languages negotiated from the
  helper's device, call and WhatsApp buttons, optional location message prepared on the helper's
  phone (never stored), manual code entry, honest states for revoked, paused and unknown codes.
- QR studio: card, sticker, wristband and plain layouts at real print size, optional centre
  symbol with forced high error correction, SVG/PNG download, printing, and a decode-back
  readability check before printing.
- Database read models (one call per screen), keyset-paginated activity, indexes on every foreign
  key, per-person limits, invitation preview and replacement, daily `pg_cron` retention purge.

### Changed

- The account home (`/{locale}/app/`) is now the people dashboard; sign-out, display name,
  language and deletion requests moved to `/{locale}/app/settings/`.

### Security

- The emergency page never renders network data as HTML and never builds links from page text;
  it sends no referrer and stores nothing about the person or the helper.

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
