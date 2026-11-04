# Security checklist

Run before each release PR into `main`. Items marked (M2+) apply once the backend exists.

## Code and dependencies

- [ ] CI green: lint, types, tests, CodeQL, gitleaks, `pnpm audit --audit-level=high`
- [ ] No new dependency without justification; new install scripts added to `allowBuilds` only after review
- [ ] No `set:html` / `dangerouslySetInnerHTML` with data that can come from users
- [ ] No secrets, personal data or dumps in the diff

## Privacy and indexing

- [ ] `pnpm check:seo` passes (private routes noindex and absent from sitemap)
- [ ] No analytics or third-party scripts added without a privacy review
- [ ] No personal or medical data in logs, errors, URLs (query strings) or telemetry

## Workflows

- [ ] Workflow `permissions:` are minimal per job
- [ ] No `${{ github.event.* }}`, `head_ref` or inputs interpolated directly into `run:`
- [ ] Deploy and release only from `main`

## Backend (M2+)

- [ ] RLS enabled on every new table; pgTAP tests for owner, member, revoked, other tenant, anon
- [ ] Every new RPC/Edge Function validates input and returns minimal fields
- [ ] Migrations reviewed for destructive changes (expand → migrate → contract)
- [ ] Emergency numbers have source + verification date + review status
