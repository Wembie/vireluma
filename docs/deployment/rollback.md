# Rollback

The site is static and every production build is traceable to a commit (`/version.json`).

## Frontend (GitHub Pages)

**Preferred — revert and redeploy (auditable):**

1. `git revert <bad-sha>` on a `hotfix/*` branch from `main`; open a PR into `main`.
2. After checks pass, merge. `deploy-pages.yml` deploys and verifies the new SHA.
3. Merge `main` back into `dev`.

**Emergency — redeploy a previous good commit (minutes):**

1. Actions → _Deploy to GitHub Pages_ → find the last successful run for the good commit →
   **Re-run all jobs**. The workflow rebuilds that exact commit and verifies it.
2. Follow up with a revert PR so `main` matches what is live.

Verify: `curl -s https://wembie.github.io/vireluma/version.json` shows the expected `sha`.

## Backend (from M2)

- Migrations are forward-only. A bad migration is fixed by a new corrective migration, tested on
  `vireluma-dev` first.
- Destructive changes follow expand → migrate → contract across separate releases so the previous
  frontend keeps working during rollback.
- Point-in-time recovery depends on the Supabase plan; document the plan's guarantees before
  storing real personal data (M2 exit criterion).

## Never roll back

- The permanent profile URL contract (`/p/`, identifier format). A rollback must never make
  printed codes stop resolving.
