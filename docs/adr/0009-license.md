# ADR-0009 — License (MIT) and brand protection

- Status: Accepted · 2026-11-04 (owner decision)

## Decision

Keep the existing **MIT** license for the source code.

## Consequences

- Anyone may reuse, modify and host the code, including commercially and closed-source. This
  maximises openness and contributor trust but offers no protection against hosted clones.
- The **VIRELUMA name, logo and brand assets are not licensed under MIT** for use as a brand;
  trademark rights are reserved (stated in README). Trademark availability has **not** been
  verified — a professional search is required before commercial launch.
- No personal data, production configuration, secrets or database dumps are ever committed
  (`.gitignore`, gitleaks in CI, GitHub push protection).

## Alternative

AGPL-3.0 (forces hosted modifications to be published). Revisit if the business model requires it;
a relicense needs agreement from all contributors, so decide before accepting external
contributions at scale.
