# ADR-0005 — Public identifier design

- Status: Accepted · 2026-11-04

## Decision

- **26 symbols of Crockford base32 = 130 bits of entropy**, canonical upper case.
- Alphabet `0-9 A-Z` minus `I L O U`: case-insensitive, no ambiguous characters, safe to print on
  a card and type by hand. Input normalisation maps `O→0`, `I/L→1` and ignores spaces/hyphens.
- Printed grouping: `XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XX`.
- Generated **server-side** in Postgres from a CSPRNG (`gen_random_bytes`) when an identifier is
  issued (M2). The TypeScript generator exists for Edge Functions and tests and uses
  `crypto.getRandomValues` only.
- Stored in `profile_identifiers` (M2), separate from the profile's internal UUID:
  `status ∈ {active, revoked}`, `issued_at`, `revoked_at`, `revoked_reason`. Revoking issues a new
  identifier for the same internal profile; history is kept for audit.
- Never derived from row IDs, sequences, names, emails or phone numbers. No lookup endpoint accepts
  anything other than a full identifier.

## Rationale

130 bits makes online enumeration infeasible even without rate limits (2^130 space); rate limiting
and abuse detection (M2/M3) still apply. Base32 keeps QR codes compact enough for wristbands
while remaining human-transcribable — a real need when a camera fails in an emergency.

## Alternatives

UUIDv4 (122 bits, 36 chars, hard to type), base64url 22 chars (case-sensitive, ambiguous glyphs),
short codes + PIN (enumerable / shared secrets — rejected).
