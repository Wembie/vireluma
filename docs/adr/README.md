# Architecture Decision Records

Each ADR records one decision, its context and its consequences. ADRs are immutable once
accepted; a change of direction is a new ADR that supersedes the old one.

| #                                          | Title                                                | Status   |
| ------------------------------------------ | ---------------------------------------------------- | -------- |
| [0001](0001-stack-and-monorepo.md)         | Stack and repository structure                       | Accepted |
| [0002](0002-github-pages-hosting.md)       | GitHub Pages as initial hosting, and its exit path   | Accepted |
| [0003](0003-branches-and-environments.md)  | Branches (`main` = PRD, `dev` = DESARROLLO) and envs | Accepted |
| [0004](0004-permanent-profile-url.md)      | Permanent profile URL format (`/p/#ID`)              | Accepted |
| [0005](0005-public-identifier.md)          | Public identifier design                             | Accepted |
| [0006](0006-backend-supabase.md)           | Supabase backend behind application ports            | Accepted |
| [0007](0007-i18n-routing.md)               | Internationalised routing with localized slugs       | Accepted |
| [0008](0008-versioning-and-releases.md)    | `VERSION` file, SemVer and controlled releases       | Accepted |
| [0009](0009-license.md)                    | License (MIT) and brand protection                   | Accepted |
| [0010](0010-apple-find-my-and-trackers.md) | Apple AirTag / Find My and third-party trackers      | Accepted |

Template: copy an existing ADR; keep sections _Context_, _Decision_, _Consequences_, _Alternatives_.
