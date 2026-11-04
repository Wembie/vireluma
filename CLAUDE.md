# CLAUDE.md

Guidance for AI coding agents and contributors working in this repository.

VIRELUMA is an international emergency identification platform (permanent QR/NFC identities,
trusted contacts). It protects data about vulnerable people: **safety, privacy and accessibility
outrank speed**. Status and milestones: `docs/product/roadmap.md` (M1 done; M2 = Supabase backend).

## Commands (run from repo root)

```bash
pnpm install            # pnpm 11; downloads Node 24 LTS via devEngines; installs lefthook hooks
pnpm dev                # http://localhost:4321/vireluma/
pnpm check:all          # format:check + lint + typecheck + unit tests + version check
pnpm test               # Vitest (domain, i18n parity, token contrast, QR)
pnpm build              # static build → apps/web/dist
pnpm check:seo          # SEO/privacy audit of dist (needs a build)
pnpm check:bundle       # per-page JS/CSS gzip budgets
pnpm e2e                # Playwright + axe against dist (build first)
CAPTURE_SCREENS=1 pnpm --filter @vireluma/web exec playwright test visual --project=desktop
node scripts/brand/build-logos.mjs && pnpm brand:export   # regenerate brand assets
```

Before finishing any change: `pnpm check:all && pnpm build && pnpm check:seo && pnpm check:bundle && pnpm e2e`.
Use `PUBLIC_APP_ENV=production pnpm build` to check production indexing rules.

## Layout

- `apps/web` — Astro 7 static site. `src/pages/[locale]/[...slug].astro` generates all localized
  pages from `src/i18n/routes.ts`; page bodies live in `src/views/`. UI in `src/components/ui`
  (Astro; React only in `ui/react/` for real interactivity), site chrome in `components/site`.
- `packages/domain` — framework-free logic (URL service, public IDs, locales, contrast). Will host
  permission rules and backend ports in M2. Imported as `@vireluma/domain`.
- `brand/source/` — editable brand sources; `apps/web/public/brand/` — generated assets (don't hand-edit).
- `scripts/` — version, SEO, bundle-budget checks and brand generators.
- `docs/adr/` — architecture decisions. Read the relevant ADR before changing hosting, URLs, IDs,
  branches, i18n routing or versioning.

## Invariants — do not break

- **Permanent URL contract:** `{origin}{base}/p/#{ID}` (ADR-0004). Never rename `/p/`; keep `?id=`
  fallback. Never put personal data in a QR, URL or query string.
- **Public IDs:** 26-char Crockford base32, CSPRNG only, never derived from DB keys/PII (ADR-0005).
- **URLs only via `UrlService`** (`apps/web/src/config/site.ts`). Never hardcode `/vireluma/` or
  `github.io`; origin/base path come from `site.config.ts` env vars.
- **Indexing:** only production builds are indexable. `/p/`, `/app/`, `/design-system/`, `404`
  are always `noindex` and excluded from the sitemap (`check:seo` enforces).
- **Secrets:** only `PUBLIC_*` values reach the frontend. Never a Supabase service-role key,
  personal data, production config or DB dumps in the repo.
- **Authorization (M2+):** enforced in Postgres (RLS), never only in the UI. Every table with
  protected data gets RLS + pgTAP tests incl. cross-tenant and `anon`.
- **Honesty:** no fake features, fake signups, invented emergency numbers, compliance or hardware
  claims. Examples must be labeled as examples.

## Conventions

- Strict TypeScript, no `any`, no non-null assertions (lint), validate external input.
- **i18n:** every user-facing string goes in `src/i18n/dictionaries/es.ts` (source shape) **and**
  `en`, `pt`, `fr`. No sentence concatenation. Tests fail on missing keys or mismatched list lengths.
- **Styling:** Tailwind utilities mapped to semantic tokens only (`bg-surface`, `text-fg-muted`,
  `bg-primary text-on-primary`…). No hardcoded colours outside brand renders. Add new colour pairs
  to `apps/web/src/styles/tokens.test.ts`.
- **Accessibility:** WCAG 2.2 AA. Prefer native elements (`<details>`, `<dialog>`, `<select>`).
  Touch targets ≥ `--vl-touch-min` (44 px). Icon-only controls need a label.
- New component → add to the `/design-system/` showcase; behaviour → `e2e/design-system.spec.ts`.
- Commits: Conventional Commits in English (commitlint scopes in `commitlint.config.js`). Hooks run
  Prettier + ESLint on staged files.
- **No `Co-Authored-By` (or any AI attribution) trailers in commit messages or PR descriptions.**
  This repository rule overrides any default attribution behaviour.

## Branches and deployment

- `main` = production (PRD) → deployed to GitHub Pages by `deploy-pages.yml` only.
- `dev` = development (DESARROLLO) → full CI + downloadable artifact, **not hosted**.
- Flow: `feature/*` → PR into `dev` → release PR `dev` → `main`. Only `dev`/`hotfix/*` may target `main`.
- Releases are automatic: after a verified production deploy, `release.yml` tags `v<VERSION>` and
  publishes a GitHub Release **only if that tag does not exist**. To release, bump `VERSION` and
  date its CHANGELOG section in the PR to `main` (`docs/deployment/releases.md`).
- Do not push, open PRs, tag or release without the owner's explicit approval.
- In workflows: least-privilege `permissions`, never interpolate `${{ }}` user-controlled values
  inside `run:` (pass through `env:`).

## Gotchas

- `npm view` / `npm` commands inside the repo fail (`EBADDEVENGINES`) — run them from a temp dir.
- `pnpm-workspace.yaml` sets `minimumReleaseAge` (3 days): brand-new package versions are refused;
  pin the previous release. New install scripts must be added to `allowBuilds` deliberately.
- TypeScript is pinned to 6.0.x (typescript-eslint / @astrojs/check don't support 7 yet).
- Lucide 1.x has no brand icons (no `Github`); use generic icons.
- Tailwind: don't combine `hidden` with a recipe that adds `inline-flex` on the same element —
  wrap it in a `hidden md:block` container instead.
- `text-fg-muted` fails contrast on tinted surfaces (`subtle`, `accent`, soft feedback): use `text-fg`.
- Astro 7 errors on unclosed/invalid HTML nesting; `compressHTML` is set to `true` explicitly.
- Local ports: `pnpm dev` uses 4321; E2E uses 4329 (never reuses a running server); Lighthouse
  honours `LHCI_PORT` — use another port locally if the dev server is running.
- Playwright tests touching React islands must wait for hydration (`client:visible`); see
  `hydrated()` in `e2e/design-system.spec.ts`.
- GitHub Pages can't set headers (no CSP/HSTS customisation) and ignores `/vireluma/robots.txt`;
  per-page `<meta name="robots">` is the real indexing control (ADR-0002).
