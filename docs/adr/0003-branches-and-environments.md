# ADR-0003 — Branches and environments

- Status: Accepted · 2026-11-04

## Context

The owner defined two long-lived branches: **`main` = production (PRD)** and
**`dev` = development (DESARROLLO)**. GitHub Pages serves one site per repository.

## Decision

| Branch      | Role             | CI                         | Build env (`PUBLIC_APP_ENV`) | Hosted where             | Supabase (M2)      |
| ----------- | ---------------- | -------------------------- | ---------------------------- | ------------------------ | ------------------ |
| `main`      | Production       | full CI + deploy + release | `production` (indexable)     | GitHub Pages             | `vireluma` (cloud) |
| `dev`       | Integration      | full CI                    | `development` (noindex)      | not hosted — CI artifact | ephemeral CI DB    |
| `feature/*` | Work in progress | CI on PR into `dev`        | `development`                | —                        | local (Docker)     |

Flow: `feature/*` → PR → `dev` → PR (release) → `main`. Hotfixes: `hotfix/*` → `main`, then
merge `main` back into `dev`. `pr-hygiene.yml` rejects PRs into `main` from any other branch.

- `dev` builds are uploaded as `web-dist-development` (14-day retention) for review and
  download; E2E, axe and Lighthouse run against that exact build.
- There is no separate staging branch. Authorised DAST (OWASP ZAP baseline, M5) runs against the
  CI preview build, never against production without explicit authorisation.
- A single Supabase cloud project (`vireluma`) is production (ADR-0006). DEV isolation comes from
  local and ephemeral CI databases; `dev` builds never point at the production project.

## Consequences

- No public URL for `dev`. If hosted previews become necessary, add Cloudflare Pages preview
  deployments (needs an account and an API token secret) — documented, not implemented.
- Production deploys are only possible from `main` (workflow guard + `github-pages` environment
  branch policy).
