-- VIRELUMA — foundation: schemas, extensions, enums and shared helpers.
--
-- Security model (ADR-0006):
--   * `public` is the only schema exposed by the Data API. Nothing in it is
--     granted to anon/authenticated by default; every grant is explicit.
--   * `private` holds helpers, rate-limit state and SECURITY DEFINER internals.
--     It is never exposed through the API.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
-- RLS policies (evaluated as the calling role) call permission helpers in `private`.
grant usage on schema private to authenticated;

-- Postgres grants EXECUTE on new functions to PUBLIC by default. Remove that
-- for everything we create so no function is callable unless granted.
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema private revoke execute on functions from public;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- ── Enums ────────────────────────────────────────────────────────────────────

create type public.member_role as enum ('owner', 'admin', 'caregiver', 'emergency_contact', 'viewer');
create type public.person_status as enum ('active', 'suspended');
-- Who may see a piece of information. `public_emergency` is returned by the
-- emergency resolver to anyone holding an active identifier.
create type public.visibility as enum ('public_emergency', 'protected', 'private');
create type public.detail_kind as enum (
  'medical_alert', 'allergy', 'medication', 'communication', 'accessibility', 'instruction'
);
create type public.identifier_status as enum ('active', 'revoked');
create type public.consent_purpose as enum (
  'profile_processing', 'health_data', 'minor_guardian', 'public_photo'
);
create type public.scan_outcome as enum ('resolved', 'revoked', 'suspended', 'not_found', 'rate_limited');

-- ── Helpers ──────────────────────────────────────────────────────────────────

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 26 symbols of Crockford base32 from 136 CSPRNG bits (130 used). See ADR-0005.
create function private.generate_public_id()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  random_bytes bytea := extensions.gen_random_bytes(17);
  result text := '';
  buffer bigint := 0;
  bits int := 0;
begin
  for i in 0..16 loop
    buffer := (buffer << 8) | get_byte(random_bytes, i);
    bits := bits + 8;
    while bits >= 5 and length(result) < 26 loop
      bits := bits - 5;
      result := result || substr(alphabet, ((buffer >> bits) & 31)::int + 1, 1);
    end loop;
    buffer := buffer & ((1::bigint << bits) - 1);
  end loop;
  return result;
end;
$$;

-- Normalises user input the same way as @vireluma/domain parsePublicId().
-- Returns null for anything that is not a well-formed identifier.
create function private.normalize_public_id(p_input text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_input is null or length(p_input) > 52 then null
    else nullif(
      (select v from (select translate(upper(regexp_replace(p_input, '[[:space:]-]', '', 'g')), 'OIL', '011') as v) s
        where v ~ '^[0-9A-HJKMNP-TV-Z]{26}$'),
      ''
    )
  end;
$$;
