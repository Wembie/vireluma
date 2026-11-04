# Environments and branch protection

See [ADR-0003](../adr/0003-branches-and-environments.md) for the rationale.

| Environment | Branch | Build `PUBLIC_APP_ENV` | Indexable | Hosted                             | Backend (M2)    |
| ----------- | ------ | ---------------------- | --------- | ---------------------------------- | --------------- |
| Local       | any    | `local`                | no        | `pnpm dev` / `pnpm preview`        | local Supabase  |
| Development | `dev`  | `development`          | no        | CI artifact `web-dist-development` | `vireluma-dev`  |
| Production  | `main` | `production`           | yes       | https://wembie.github.io/vireluma/ | `vireluma-prod` |

## Configuration values

| Name                                            | Kind                         | Where                                        | Notes                                     |
| ----------------------------------------------- | ---------------------------- | -------------------------------------------- | ----------------------------------------- |
| `PUBLIC_SITE_ORIGIN`                            | repository **variable**      | Settings → Secrets and variables → Variables | default `https://wembie.github.io`        |
| `PUBLIC_BASE_PATH`                              | repository **variable**      | same                                         | default `/vireluma`; `/` on custom domain |
| `PUBLIC_SUPABASE_URL`                           | environment variable (M2)    | Environments → `development` / `production`  | public                                    |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY`               | environment variable (M2)    | same                                         | public by design; RLS protects data       |
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` | environment **secrets** (M2) | same, with required reviewers on production  | migrations only; never in the frontend    |

Never place a service-role key or any secret in a `PUBLIC_*` variable — it is embedded in the
static build and visible to everyone.

## One-time owner setup on GitHub (cannot be automated from this repository)

1. **Push `dev`** and set the default branch to `dev` (so PRs target it by default), or keep
   `main` as default and always pick the base manually.
2. **Pages**: Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. **Environments** (Settings → Environments):
   - `github-pages` → Deployment branches and tags → **Selected branches: `main`** only.
   - `production` → required reviewer: owner; deployment branches: `main`.
   - `development` → deployment branches: `dev`.
4. **Rulesets / branch protection** (Settings → Rules → Rulesets):
   - `main`: require a pull request (1 approval when there is a second maintainer), require
     status checks _Format · Lint · Types · Unit tests_, _Build · SEO · Bundle budget_,
     _E2E · Accessibility (axe)_, _Lighthouse_, _Dependency audit_, _CodeQL_, _Secret scanning_,
     _Branch flow_, _Conventional Commits_; block force pushes and deletions; require linear history.
   - `dev`: same required checks; block force pushes and deletions.
5. **Security** (Settings → Code security): enable Dependabot alerts and security updates, secret
   scanning and **push protection**, and **private vulnerability reporting** (used by
   `SECURITY.md`).
6. **Actions** (Settings → Actions → General): workflow permissions **read repository contents**
   by default (each workflow requests what it needs); allow GitHub Actions to create PRs: off.
