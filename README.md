<p align="center">
  <img src="apps/web/public/brand/logo/vireluma-horizontal.svg" alt="VIRELUMA" width="320" />
</p>

<p align="center"><strong>Every life deserves to be found.</strong></p>

VIRELUMA is an international personal safety and emergency identification platform. It connects a
person who needs help — an older adult, someone living with dementia, a child, a person with a
disability — with the people who care for them, through a **permanent QR/NFC identity** that
anyone can scan with a phone, with no app and no sign-up.

> **Status: in development (0.1.0).** The public website, brand, design system and delivery
> pipeline are in place. Accounts, profiles and the emergency page are being built
> ([roadmap](docs/product/roadmap.md)). VIRELUMA does not replace emergency services.

Live site: https://wembie.github.io/vireluma/

## Principles

- **The QR holds no personal data** — only a permanent link with a random 130-bit identifier.
- **You decide what is visible** — public in emergencies, protected, or private.
- **Never in search engines** — personal profiles are noindex and outside sitemaps.
- **Permissions enforced by the database** (Row Level Security), never only by the UI.
- **Accessible** (WCAG 2.2 AA), **multilingual** (es, en, pt, fr), **honest** about limits.

## Architecture

| Part                | Technology                                                              |
| ------------------- | ----------------------------------------------------------------------- |
| Website / app shell | Astro 7 (static), React 19 islands, Tailwind CSS 4, TypeScript (strict) |
| Domain logic        | `packages/domain` (framework-free, shared with backend functions)       |
| Backend (M2)        | Supabase: Postgres + RLS, Auth, Edge Functions                          |
| Hosting             | GitHub Pages from `main` (custom-domain/edge migration planned)         |
| Quality             | Vitest, Playwright + axe, Lighthouse CI, CodeQL, gitleaks               |

Read: [architecture overview](docs/architecture/overview.md) · [ADRs](docs/adr/README.md).

```
apps/web/            Astro site: pages, views, components/ui (design system), i18n, styles
packages/domain/     URL service, public identifiers, locales, contrast utilities
brand/source/        Editable brand sources (outlined wordmark)
scripts/             Brand generation, version, SEO and bundle checks
docs/                ADRs, architecture, deployment, security, product
.github/workflows/   CI, security, Pages deploy, release, PR hygiene
```

## Branches

| Branch | Meaning                  | Deployed                     |
| ------ | ------------------------ | ---------------------------- |
| `main` | Production (PRD)         | GitHub Pages, on every merge |
| `dev`  | Development (DESARROLLO) | CI artifact only             |

Work on `feature/*` → PR into `dev` → release PR `dev` → `main`. See
[environments](docs/deployment/environments.md).

## Getting started

Requirements: **pnpm 11** (Node 24 LTS is downloaded automatically by pnpm via `devEngines`;
`.nvmrc` is provided for other tools).

```bash
pnpm install          # also installs git hooks (lefthook)
pnpm dev              # http://localhost:4321/vireluma/
```

| Command              | Does                                                         |
| -------------------- | ------------------------------------------------------------ |
| `pnpm check:all`     | format check, lint, typecheck, unit tests, version check     |
| `pnpm test:coverage` | unit tests with coverage thresholds                          |
| `pnpm build`         | static build into `apps/web/dist`                            |
| `pnpm check:seo`     | SEO + privacy audit of the build                             |
| `pnpm check:bundle`  | per-page JS/CSS budgets                                      |
| `pnpm e2e`           | Playwright + axe against the built site (`pnpm build` first) |
| `pnpm brand:export`  | regenerate raster brand assets from the SVG masters          |

Configuration: copy `.env.example`; only `PUBLIC_*` values, never secrets.

## Versioning and releases

`VERSION` is authoritative (SemVer); see [CHANGELOG](CHANGELOG.md) and
[release process](docs/deployment/releases.md).

## Security

Please report vulnerabilities privately — see [SECURITY.md](SECURITY.md). Threat model:
[docs/security/threat-model.md](docs/security/threat-model.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Code: [MIT](LICENSE). The VIRELUMA name and logo are not licensed for use as a brand; all
trademark rights are reserved.
