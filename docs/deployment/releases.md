# Release process

Policy: [ADR-0008](../adr/0008-versioning-and-releases.md).

Releases are **automatic but version-driven**: the last job of _Deploy to GitHub Pages_ calls
`release.yml`, which creates tag `v<VERSION>` and the GitHub Release only if that tag does not
exist yet. Merges that do not bump `VERSION` deploy normally and release nothing.

## Shipping a new version

1. On `dev`, bump `VERSION` (SemVer) and move entries into a dated section in `CHANGELOG.md`:
   `## [0.2.0] - 2026-12-01`. Optional draft from commits: `git cliff --unreleased`.
2. `pnpm check:version -- --release` must pass locally.
3. Open the release PR `dev → main` titled `chore(release): v0.2.0`. Merge when green.
4. _Deploy to GitHub Pages_ builds, deploys and **verifies** the live SHA, then the **Release** job
   tags the merge commit `v0.2.0` and publishes the GitHub Release with the CHANGELOG section,
   commit SHA, site URL and run link.
5. Fast-forward `dev` to `main` so both branches share the merge commit.

If the release job fails (e.g. CHANGELOG section not dated), the deploy is still live. Fix the
CHANGELOG through a PR, or run Actions → _Release_ manually on `main` once the cause is fixed — the
manual run also requires a successful deploy of the same commit.

Every release therefore has: version, date, changelog, commit SHA, build status, deployment status.
