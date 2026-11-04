# Architecture overview

```
                 ┌─────────────────────────── GitHub ────────────────────────────┐
  feature/* ──PR──▶ dev (DESARROLLO) ──PR──▶ main (PRD) ──▶ deploy-pages.yml ──▶ GitHub Pages
                 │   CI + artifact            CI + deploy + release                 │
                 └───────────────────────────────────────────────────────────────┘
                                                                     │ static HTML/CSS/JS
                                                                     ▼
    Browser ── marketing pages (static, indexable, 4 languages)
            ── /p/#ID emergency resolver (static shell, noindex)      ──▶ Supabase (M2)
            ── /app/ authenticated product (React islands, noindex)    ──▶  Postgres + RLS,
                                                                            Auth, Edge Functions
```

## Layers

| Layer          | Location                          | Responsibility                                            |
| -------------- | --------------------------------- | --------------------------------------------------------- |
| Domain         | `packages/domain`                 | Pure rules: URLs, identifiers, locales, (M2) permissions. |
| Application    | `apps/web/src/lib`, (M2) services | Use cases orchestrating ports.                            |
| Infrastructure | (M2) `apps/web/src/adapters`      | Supabase adapters implementing domain ports.              |
| UI             | `apps/web/src/components`, views  | Design system, pages, islands.                            |
| Data           | (M2) `supabase/`                  | Migrations, RLS policies, Edge Functions, pgTAP tests.    |

## Key contracts

- **Permanent URL** `{origin}{base}/p/#{ID}` — ADR-0004. Never renamed.
- **Public identifier** — 130-bit Crockford base32, server-generated, revocable — ADR-0005.
- **URL generation** only through `UrlService` — origin/base path are configuration.
- **Authorization** in the database (RLS + SECURITY DEFINER functions), never in the UI.

## Data visibility levels (from M2)

1. _Public in emergencies_ — returned by the resolver for an active identifier.
2. _Protected_ — requires an additional authorization flow (design in M3; never a shared PIN).
3. _Private_ — only authorized members of the profile.

## Quality gates

Format, lint, strict types, unit tests (coverage thresholds on domain), WCAG token contrast
tests, SEO/privacy audit of the build, bundle budgets, Playwright E2E + axe (mobile and desktop,
light and dark), Lighthouse, dependency audit, CodeQL, gitleaks.
