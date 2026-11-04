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
- Releases are manual (`release.yml`, `workflow_dispatch` on `main`): the operator types the
  version to confirm; the workflow checks SemVer, a dated CHANGELOG section, tag uniqueness and a
  successful production deploy of the same commit, then creates the annotated tag and the GitHub
  Release with notes, SHA, site URL and run link. No automatic release per commit.

Process: [docs/deployment/releases.md](../deployment/releases.md).
