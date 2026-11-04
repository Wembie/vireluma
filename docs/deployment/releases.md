# Release process

Policy: [ADR-0008](../adr/0008-versioning-and-releases.md).

1. On `dev`, bump `VERSION` (SemVer) and move entries into a dated section in `CHANGELOG.md`:
   `## [0.2.0] - 2026-12-01`. Optional draft from commits: `git cliff --unreleased`.
2. `pnpm check:version -- --release` must pass locally.
3. Open the release PR `dev → main` titled `chore(release): v0.2.0`. Merge when green.
4. Wait for _Deploy to GitHub Pages_ to finish with **verify** passing.
5. Actions → _Release_ → Run workflow on `main`, typing `0.2.0` to confirm. The workflow tags
   `v0.2.0` and publishes the GitHub Release (notes + commit SHA + site URL + run link).
6. Merge `main` back into `dev` if the release PR introduced merge commits.

Every release therefore has: version, date, changelog, commit SHA, build status, deployment status.
