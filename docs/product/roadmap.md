# Roadmap

Each milestone ends with verifiable exit criteria. Dates are not committed until the previous
milestone is done.

## M1 — Foundation, brand and public site · **done in 0.1.0** (pending first deploy)

- [x] Monorepo, strict tooling, Conventional Commits, `VERSION`/CHANGELOG
- [x] Brand identity (symbol, wordmark, lockups, icons, social) from one geometry source
- [x] Design tokens (light/dark, AA-verified) and design-system showcase
- [x] Public site in es/en/pt/fr with localized slugs, hreflang, structured data, sitemap
- [x] CI (dev + main), CodeQL, gitleaks, Pages deploy with verification, release workflow
- [x] ADRs 0001–0010, deployment, security and product docs
- [ ] **Owner:** enable Pages (GitHub Actions source), environments, rulesets — `environments.md`
- [ ] First production deploy verified (`/version.json` SHA matches)

Exit: CI green on `dev` and `main`; live site serves the release SHA; Lighthouse a11y/SEO/BP ≥ 95.

## M2 — Backend foundation and authentication · **in progress**

- [x] Single Supabase cloud project `vireluma` = production; local Docker stack and ephemeral CI
      databases for development (ADR-0006)
- [x] Migrations: people, person_members (owner/admin/caregiver/emergency_contact/viewer),
      emergency_contacts, emergency_details (visibility levels), public_identifiers, consent_records,
      invitations, audit_logs (no values), scan_events (no IP/UA), emergency_numbers (sourced),
      account_deletion_requests — see `docs/architecture/database.md`
- [x] RLS on every table; pgTAP for owner, caregiver, viewer, removed member, other family, `anon`
- [x] `resolve_emergency_profile` returning public fields only, POST-only, rate limited
- [x] Account area: register + email confirmation, sign-in, sign-out (local/global), password
      reset, deletion request — E2E against the local stack (CI database job)
- [x] Auth port + domain permission matrix
- [x] Production schema applied and recorded; auth settings (site URL, redirects, 12-char
      passwords, secure password change) applied with `supabase config push`
- [ ] `deploy-database` job: migrations to production from `main` with approval — needs Supabase
      access token and DB password as `production` environment secrets
- [x] Accounts enabled in production builds as a **beta** (owner decision 2026-11-04), before
      the privacy notice and a real SMTP provider — both remain required before real families
- [ ] Before real families: paid plan with backups, real SMTP, legal review of region/transfer

Exit: cross-tenant and anonymous access tests pass in CI; no service key outside Supabase;
accounts work end-to-end on the production project.

## M3 — Core product · **in beta** (code in 0.2.0, enabled in production in 0.3.0)

- [x] Dashboard of people with setup status, codes and last scan
- [x] Person creation with consent (minor ⇒ guardian confirmation); setup resumes from server data
- [x] Editors: profile, emergency contacts (E.164 with preview), emergency details (private by
      default; health kinds gated by consent), ordering, per-person limits
- [x] Identifiers: issue, replace (lost tag), revoke; history
- [x] Sharing: one-time invitation links bound to an email, roles, removal, leave, ownership
      transfer; pause and deletion; consent center (health data)
- [x] Activity: scans and value-free audit trail, keyset paginated
- [x] `/p/#ID` emergency page: no framework (~3 KB JS), 4 languages, call/WhatsApp, optional
      location message, manual code entry, honest states (ADR-0011)
- [x] QR studio: card / sticker / wristband / plain at print size, SVG/PNG/print, centre symbol
      with forced ECC H, decode-back readability check
- [x] Retention purge (`pg_cron`), indexes on every foreign key, read models (one call per screen)
- [x] E2E (desktop + mobile, axe + overflow) for the full flow against the local stack
- [ ] PWA decision (no caching of private data on shared devices by default)
- [ ] URL-stability E2E across redeploys (needs the production deploy of M3)
- [ ] Physical print tests of the layouts with real phones (claims only after tests)
- [ ] `protected` visibility flow (verified responders) — design pending, never a shared PIN

## M4 — Devices

Device registry (type, manufacturer, serial, status, last verification), NFC NDEF URI guidance
(Web NFC: Android Chrome only), hardware test matrix — claims only after real tests; tracker
research spike (ADR-0010 option C).

## M5 — Quality, security and compliance

Full threat model review, OWASP ASVS L2 checklist, ZAP baseline on CI preview builds, k6 load
tests against DEV with explicit workload assumptions (p50/p95/p99), privacy docs
(data classification, consent, retention), country compliance matrix starting with Colombia —
with mandatory qualified legal review flags.

## M6 — Operations and permanent domain

Privacy-safe observability (structured logs, correlation IDs, alerts), runbook, backups and
recovery drills, custom domain migration (docs/deployment/custom-domain-migration.md), then
permanent QR issuance.
