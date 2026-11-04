# Database

Postgres on Supabase (ADR-0006). Source of truth: `supabase/migrations/`. Tests:
`supabase/tests/database/` (pgTAP). Run locally with Docker:

```bash
pnpm exec supabase start          # local stack (Docker)
pnpm exec supabase db reset       # apply all migrations from scratch
pnpm exec supabase test db        # pgTAP: grants, RLS matrix, resolver
pnpm exec supabase stop
```

## Schemas

| Schema    | Exposed by API | Contents                                                           |
| --------- | -------------- | ------------------------------------------------------------------ |
| `public`  | yes            | Tables (RLS on all) and RPCs. Nothing granted by default.          |
| `private` | no             | Permission helpers, ID generator, audit trigger, rate-limit state. |

`anon` can do exactly two things: execute `resolve_emergency_profile` and read verified
`emergency_numbers` (enforced by `001_schema_security.test.sql`).

## Entities

| Table                       | Purpose                                                       | Writes                                     |
| --------------------------- | ------------------------------------------------------------- | ------------------------------------------ |
| `account_profiles`          | Display name / locale of a signed-in account (1:1 auth.users) | own row                                    |
| `people`                    | A protected person                                            | `create_person`, editors (allowed columns) |
| `person_members`            | Account ↔ person with a role                                  | RPCs only                                  |
| `emergency_contacts`        | Who to call; E.164 phone; visibility                          | editors                                    |
| `emergency_details`         | Alerts, allergies, medication, communication, instructions    | editors (health kinds need consent)        |
| `public_identifiers`        | Opaque QR/NFC IDs; one active per person; revocable           | RPCs only                                  |
| `consent_records`           | Purpose-bound consent with policy version; append + revoke    | RPCs only (owner)                          |
| `invitations`               | Email-bound invitations; only the token's SHA-256 is stored   | RPCs only (managers)                       |
| `audit_logs`                | Who did what; **column names only, never values**             | triggers only                              |
| `scan_events`               | Resolver outcomes; no IP or user agent                        | resolver only                              |
| `emergency_numbers`         | Country registry with source URL, verification date, status   | migrations only                            |
| `account_deletion_requests` | Right-to-erasure requests                                     | `request_account_deletion`                 |

## Permission matrix

Mirrored in `packages/domain/src/permissions.ts` for the UI; the database is the authority.

| Action                                 | owner | admin | caregiver | emergency_contact | viewer |
| -------------------------------------- | :---: | :---: | :-------: | :---------------: | :----: |
| View person, contacts, details         |   ✓   |   ✓   |     ✓     |         ✓         |   ✓    |
| Edit profile and emergency information |   ✓   |   ✓   |     ✓     |                   |        |
| View scan history                      |   ✓   |   ✓   |     ✓     |                   |        |
| Issue / revoke identifiers             |   ✓   |   ✓   |           |                   |        |
| Invite and remove members (non-admin)  |   ✓   |   ✓   |           |                   |        |
| Grant / remove the admin role          |   ✓   |       |           |                   |        |
| View audit trail                       |   ✓   |   ✓   |           |                   |        |
| Consent, suspend, transfer, delete     |   ✓   |       |           |                   |        |

Any member except the owner may leave. Ownership is transferred, never invited.

## Visibility levels

`public_emergency` (returned by the resolver) · `protected` (reserved for an additional
authorization flow — never a shared PIN; not offered in the UI yet) · `private` (members only). Contacts default to
`public_emergency` (so helpers can call); details default to `private`. `full_name` and
`date_of_birth` are never returned by the resolver.

## Emergency resolver

`resolve_emergency_profile(p_public_id)` — VOLATILE (POST only, so IDs stay out of URLs),
SECURITY DEFINER. Normalises the ID like `@vireluma/domain`, rate-limits per identifier
(120/min) and globally for unknown IDs (600/min), records a scan event, and returns
`{ status: active | revoked | suspended | not_found | invalid | rate_limited, … }` with public
fields only. Per-IP limits belong at the edge (after the domain migration, ADR-0002).

## Read models (one call per screen)

Each account screen reads through one SECURITY DEFINER function that checks membership itself
and returns everything the screen needs, so a phone on a slow network makes one round trip
instead of N+1 table reads. Writes stay on RLS-guarded tables or RPCs.

| Function                                                        | Who                       | Returns                                                                                                                                    |
| --------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `list_my_people()`                                              | signed-in                 | Dashboard rows (role, counts, active code, last scan for editors). Capped at 200.                                                          |
| `get_person_workspace(person)`                                  | members                   | Person, contacts, details, active and last 5 revoked codes, consents, members (with email), invitations (managers), scan summary (editors) |
| `get_person_activity(person, before_audit, before_scan, n≤100)` | editors (audit: managers) | Keyset pages over `audit_logs` / `scan_events` by id — constant cost however long the history grows.                                       |
| `preview_invitation(token)`                                     | signed-in, rate limited   | What the invitee is accepting — details only when addressed to the signed-in email.                                                        |

## Limits and invariants (M3)

- Every foreign key has a non-partial index (cascades and joins stay cheap); enforced by
  `004_core_product.test.sql` for every future migration.
- Per person: at most 10 contacts and 30 details (limit trigger locks the parent row, so concurrent
  inserts cannot race past it); at most 20 pending invitations. Per account: 50 owned people.
- Reordering (`reorder_emergency_contacts` / `reorder_emergency_details`) requires the complete,
  current list of ids, so a stale screen cannot silently drop an item (`40001`).
- Invitations are shared as a one-time link (`/app/invite/#token`, token only in the fragment);
  a new invitation to the same address replaces the pending one; existing members cannot be
  re-invited.
- The resolver also returns `is_minor` so helpers know to stay with a child.

## Retention

`private.purge_expired_data()` runs daily at 03:17 UTC through `pg_cron`: scan events after
12 months, audit logs after 24 months, ended invitations after 90 days, rate-limit windows after
1 hour. Periods are drafts pending legal review (`docs/privacy/data-retention.md`).

## Rules for new migrations

- Enable RLS on every new table; grant API roles only what is needed, explicitly.
- New SECURITY DEFINER functions: `set search_path = ''`, own authorization check, explicit
  `grant execute`.
- Never log values of personal or medical columns.
- Add pgTAP coverage for owner, another family, a lower role and `anon`.
- Expand → migrate → contract for destructive changes (there is no cloud staging; ADR-0006).
