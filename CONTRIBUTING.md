# Contributing to VIRELUMA

Thank you for helping. VIRELUMA handles data about vulnerable people, so we favour safety,
privacy and clarity over speed.

## Workflow

1. Branch from `dev`: `feature/<short-name>`, `fix/<short-name>`, `docs/<short-name>`.
2. Commit with [Conventional Commits](https://www.conventionalcommits.org/) in English, e.g.
   `feat(web): add language switcher to footer`. Hooks validate messages and formatting.
3. Run `pnpm check:all`, `pnpm build`, `pnpm check:seo` and `pnpm e2e` before opening a PR.
4. Open the PR into **`dev`**. Only `dev` (or `hotfix/*`) may open PRs into `main`.
5. Keep PRs small and focused; describe user impact, security/privacy impact and how you tested.

## Rules

- Strict TypeScript; no `any`; validate external input; never swallow errors silently.
- Use design tokens and existing components; no hardcoded colours or page-specific styles.
- All user-facing text goes through the dictionaries for **all four** locales.
- Accessibility is a requirement, not a follow-up (see `docs/product/accessibility-guidelines.md`).
- Never commit secrets, personal data, production configuration or database dumps.
- Database changes only through migrations, with RLS and tests (from M2).
- Do not add dependencies without explaining why the platform or existing code is not enough.

## Architecture decisions

Significant decisions need an ADR in `docs/adr/` (copy an existing one).
