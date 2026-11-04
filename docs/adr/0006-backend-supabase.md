# ADR-0006 — Supabase backend behind application ports

- Status: Accepted (implementation in M2) · 2026-11-04

## Decision

- Supabase (managed Postgres, Auth, Row Level Security, Edge Functions, Storage) as the first
  backend, with **one cloud project, `vireluma`, which is production** (owner decision,
  2026-11-04, to stay on the free plan). There is no cloud DEV/staging project:
  - local development uses the Supabase CLI stack in Docker;
  - every PR runs migrations and pgTAP tests against an ephemeral database in CI;
  - only `main` applies migrations to the cloud project, through the `production` GitHub
    environment with required reviewer approval;
  - `dev` builds are never configured with the production project's URL or key.
- The browser uses only the project URL and the **publishable** key, which are public by design.
  Every table with protected data has RLS enabled; authorization never relies on UI filtering.
- Service-role / secret keys exist only in Supabase Edge Function secrets and, if ever needed, in
  GitHub environment secrets for migrations — never in the frontend, artifacts or logs.
- Public emergency access goes through a single narrow path: an RPC/Edge Function that takes a
  full public identifier and returns only fields marked _public in emergencies_. No table is
  directly readable by `anon`.
- Schema changes only via versioned migrations in `supabase/migrations`, validated in CI with
  `supabase start` + `supabase db reset` + pgTAP tests (incl. cross-tenant and anonymous access).
- Application code talks to **ports** (e.g. `ProfileRepository`, `EmergencyResolver`,
  `AuthService`) defined in `packages/domain`; the Supabase adapter lives in `apps/web`. This
  keeps a migration to self-hosted Postgres or another provider contained.

## Consequences / open items

- Data residency: choose the Supabase region with the legal review (Colombia first; Ley 1581
  international transfer rules apply). Tracked in the compliance matrix (M5).
- Rate limiting is not built into PostgREST; the emergency resolver will be an Edge Function with
  a token-bucket table, later moved to the edge (Cloudflare) after the domain migration.
- Local development of M2 requires Docker running (the Supabase CLI starts a local stack).
- **Risk — no cloud staging:** a migration is first exercised against real cloud infrastructure
  in production. Mitigations: ephemeral-DB tests on every PR, `supabase db push --dry-run` in the
  deploy job, expand → migrate → contract changes, manual approval. Revisit (add a second project)
  before storing real personal data at scale.
- **Risk — free plan:** inactive free projects are paused and backups are limited. Upgrade the
  production project to a paid plan with backups/PITR **before** onboarding real families (M2
  exit criterion).
