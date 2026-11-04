# ADR-0001 — Stack and repository structure

- Status: Accepted · 2026-11-04

## Context

VIRELUMA needs indexable multilingual marketing pages, a fast emergency page that works on
low-end phones, and (from M2) an authenticated product UI. Initial hosting is static
(ADR-0002). The team is small, so tooling must be boring, well documented and strict.

## Decision

- **Astro 7** (`output: 'static'`) for all pages; ships zero JavaScript by default.
- **React 19** only for interactive islands (forms, tabs, toasts, the authenticated app).
- **TypeScript 6.0, strict** (+ `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
  TypeScript 7 is not used yet: `typescript-eslint` and `@astrojs/check` support `<6.1`.
- **Tailwind CSS 4** mapped exclusively to semantic design tokens.
- **pnpm workspaces** monorepo with one internal package today:
  - `apps/web` — the site and future app shell (UI components and i18n live here until a second
    consumer exists).
  - `packages/domain` — framework-free logic shared with future Edge Functions: URL service,
    public identifiers, locale negotiation, contrast maths, and (M2) permission evaluation.
- **Node 24 LTS**, pinned via `devEngines.runtime` (pnpm downloads it) and `.nvmrc`.
  Astro ≥ 7.4 requires Node ≥ 22.23.4 (security floor).
- Supply-chain hardening in `pnpm-workspace.yaml`: install scripts only for allow-listed packages;
  `minimumReleaseAge` of 3 days for new versions.
- Tests: Vitest (unit), Playwright + axe-core (E2E/a11y), Lighthouse CI.

## Consequences

- Public pages are plain HTML/CSS; the JS budget is enforced per page (`scripts/bundle-budget.mjs`).
- No `packages/ui`, `packages/i18n`, `packages/config` yet — avoided speculative abstraction.
  Extract when a second app (e.g. a native shell) needs them.

## Alternatives considered

- **Next.js / Remix**: strong for SSR, but SSR is unavailable on GitHub Pages and static export
  adds friction. Revisit if we move to an SSR host (ADR-0002).
- **SvelteKit**: good, but React has the larger accessible-component and hiring ecosystem.
