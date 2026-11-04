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
- [ ] Production auth settings (site URL, redirects, email rules) — needs `supabase login`
- [ ] `deploy-database` job: migrations to production from `main` with approval — needs Supabase
      access token and DB password as `production` environment secrets
- [ ] Enable accounts in production builds once the two items above are done
- [ ] Before real families: paid plan with backups, real SMTP, legal review of region/transfer

Exit: cross-tenant and anonymous access tests pass in CI; no service key outside Supabase;
accounts work end-to-end on the production project.

## M3 — Core product

Dashboard, people, profile wizard (server-side drafts), editors, permissions, invitations,
ownership transfer, consent center, `/p/#ID` emergency page, QR studio (SVG/PNG/print, templates,
logo with error-correction check, decode-back readability validation), card and wristband
layouts, URL-stability E2E across edits and redeploys. PWA decision (no caching of private data on
shared devices by default).

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
