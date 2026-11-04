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

## M2 — Backend foundation and authentication

- Supabase projects `vireluma-dev` / `vireluma-prod` (owner creates; region decided with legal)
- Migrations: profiles, profile_members (owner/admin/caregiver/emergency_contact/viewer),
  emergency_contacts, emergency_information (visibility level), profile_identifiers, consent_records,
  invitations, audit_logs, scan_events (no PII), country_configurations (emergency numbers with
  source, verified_at, review_status), account_deletion_requests
- RLS on every table; pgTAP tests for owner, member, revoked member, other tenant, `anon`
- Auth: email/password, email verification, recovery, session revocation, account deletion
- `resolve_public_profile` path returning public fields only, rate limited
- CI job running `supabase db reset` + tests; ports/adapters in place

Exit: cross-tenant and anonymous access tests pass; no service key outside Supabase.

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
