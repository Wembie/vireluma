# Supabase production project

One cloud project, `vireluma`, is production (ADR-0006). Development uses the local Docker stack
and ephemeral CI databases. Public values live in repository variables `SUPABASE_URL` and
`SUPABASE_PUBLISHABLE_KEY`; they are injected only into `main` builds.

## Project creation settings (done)

- Data API: enabled · Automatically expose new tables: **disabled** · Automatic RLS: **enabled**
- No GitHub integration (migrations go through reviewed PRs and GitHub Actions).
- Region: **`us-west-2` (Oregon, United States)**, chosen through the "Americas" group. Data of
  Colombian users is therefore transferred internationally: Ley 1581 transfer rules need legal
  review before real data is stored (compliance matrix, M5).

## Auth and API settings (managed as code)

Production settings live in `supabase/config.toml`: the shared security values plus the
`[remotes.production]` overrides (site URL, redirect URLs, email rate limit, pooler sizing).

```bash
pnpm exec supabase link --project-ref fbimuyeusdslravcrfhr   # once per machine
pnpm exec supabase config diff                               # review — read only
pnpm exec supabase config push                               # apply (production change)
```

Still manual in the dashboard: leaked-password protection (paid plans), a real SMTP provider and
email templates.

## Applying migrations (M2, next step)

A `deploy-database` job will run on `main` in the `production` environment (required reviewer)
with secrets `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD`:
`supabase link` → `supabase db push --dry-run` → approval → `supabase db push`. Until that job
exists, **do not** run `db push` from a laptop against production.

## Before real families use it

- Upgrade to a paid plan (free projects pause after inactivity; backups/PITR limited).
- Real SMTP provider with SPF/DKIM for verification and invitation emails.
- Legal review of region/data transfer, privacy notice and consent texts.
