# ADR-0008 — `VERSION` file, SemVer and controlled releases

- Status: Accepted · 2026-11-04

## Decision

- `/VERSION` is the only authoritative version. The root `package.json` has no `version`;
  workspace packages are private `0.0.0` and never published. `scripts/version.mjs check` fails
  if this drifts.
- SemVer. Pre-1.0 minors may contain breaking changes, but the permanent profile URL contract
  (ADR-0004) is never broken at any version.
- Conventional Commits enforced locally (lefthook + commitlint) and on PRs (`pr-hygiene.yml`).
  `git-cliff` can draft changelog entries; a human curates `CHANGELOG.md`.
- The build embeds version and commit SHA (`/version.json`, `<meta name="vireluma:build">`,
  footer) for deployment traceability.
- Releases are **automatic and version-driven** (amended 2026-11-04 at the owner's request): after
  `deploy-pages.yml` verifies the live deployment, it calls `release.yml`. If tag `v<VERSION>`
  does not exist, the workflow checks SemVer and a dated CHANGELOG section, then creates the
  annotated tag on the deployed commit and the GitHub Release with notes, SHA, site URL and run
  link. If the tag exists it does nothing, so ordinary merges never create releases and duplicate
  releases are impossible. A manual `workflow_dispatch` run on `main` remains for backfills.

Process: [docs/deployment/releases.md](../deployment/releases.md).
