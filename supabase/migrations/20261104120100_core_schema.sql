-- VIRELUMA — core tables, constraints, indexes and Row Level Security.
--
-- Vocabulary: an *account* is a signed-in user (auth.users). A *person* is
-- someone protected by VIRELUMA; accounts manage people through memberships.
-- Writes that span several rows or need extra checks go through RPCs
-- (next migration); direct table writes are limited to simple, RLS-guarded edits.

-- ── Accounts ─────────────────────────────────────────────────────────────────

create table public.account_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(btrim(display_name)) between 1 and 80),
  preferred_locale text not null default 'es' check (preferred_locale in ('es', 'en', 'pt', 'fr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_locale text := new.raw_user_meta_data ->> 'locale';
begin
  insert into public.account_profiles (id, preferred_locale)
  values (new.id, case when v_locale in ('es', 'en', 'pt', 'fr') then v_locale else 'es' end);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  requested_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'cancelled', 'completed')),
  processed_at timestamptz,
  check ((status = 'pending') = (processed_at is null))
);
create unique index account_deletion_one_pending on public.account_deletion_requests (user_id)
  where status = 'pending';

-- ── People and memberships ───────────────────────────────────────────────────

create table public.people (
  id uuid primary key default gen_random_uuid(),
  -- Shown to helpers in an emergency (with the emergency message).
  preferred_name text not null check (char_length(btrim(preferred_name)) between 1 and 60),
  emergency_message text check (char_length(emergency_message) <= 280),
  -- Private to members.
  full_name text check (char_length(full_name) <= 120),
  date_of_birth date check (date_of_birth > date '1900-01-01'),
  is_minor boolean not null default false,
  preferred_locale text not null default 'es' check (preferred_locale in ('es', 'en', 'pt', 'fr')),
  country_code text check (country_code ~ '^[A-Z]{2}$'),
  status public.person_status not null default 'active',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.person_members (
  person_id uuid not null references public.people (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  added_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (person_id, user_id)
);
create unique index person_members_one_owner on public.person_members (person_id) where role = 'owner';
create index person_members_user on public.person_members (user_id);

-- ── Emergency information ────────────────────────────────────────────────────

create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  relationship text check (char_length(relationship) <= 40),
  -- E.164 only; formatting is a presentation concern.
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  priority smallint not null default 1 check (priority between 1 and 10),
  visibility public.visibility not null default 'public_emergency',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index emergency_contacts_person on public.emergency_contacts (person_id, priority);

create table public.emergency_details (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  kind public.detail_kind not null,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  details text check (char_length(details) <= 500),
  -- Private by default: showing anything publicly is an explicit choice.
  visibility public.visibility not null default 'private',
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index emergency_details_person on public.emergency_details (person_id, sort_order);

-- ── Public identifiers (QR / NFC) ────────────────────────────────────────────

create table public.public_identifiers (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  public_id text not null unique default private.generate_public_id()
    check (public_id ~ '^[0-9A-HJKMNP-TV-Z]{26}$'),
  status public.identifier_status not null default 'active',
  issued_at timestamptz not null default now(),
  issued_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users (id) on delete set null,
  revoked_reason text check (char_length(revoked_reason) <= 200),
  check ((status = 'revoked') = (revoked_at is not null))
);
create unique index public_identifiers_one_active on public.public_identifiers (person_id)
  where status = 'active';

-- ── Consent ──────────────────────────────────────────────────────────────────

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  purpose public.consent_purpose not null,
  policy_version text not null check (char_length(policy_version) between 1 and 40),
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz
);
create unique index consent_one_active on public.consent_records (person_id, purpose)
  where revoked_at is null;

create function private.has_active_consent(p_person uuid, p_purpose public.consent_purpose)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.consent_records
    where person_id = p_person and purpose = p_purpose and revoked_at is null
  );
$$;

-- Health-related details require explicit, active health-data consent.
create function private.enforce_health_consent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.kind in ('medical_alert', 'allergy', 'medication')
     and not private.has_active_consent(new.person_id, 'health_data') then
    raise exception 'Health data consent is required for %', new.kind
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger emergency_details_health_consent
  before insert or update of kind, person_id on public.emergency_details
  for each row execute function private.enforce_health_consent();

-- ── Invitations ──────────────────────────────────────────────────────────────

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  email text not null check (char_length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+$'),
  role public.member_role not null check (role <> 'owner'),
  -- Only the SHA-256 of the token is stored; the token is shown once to the inviter.
  token_hash bytea not null unique,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz
);
create index invitations_person on public.invitations (person_id);

-- ── Audit and scans (no personal or medical values are ever stored here) ────

create table public.audit_logs (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  person_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  -- Changed column NAMES only, never values.
  details jsonb not null default '{}'::jsonb
);
create index audit_logs_person on public.audit_logs (person_id, occurred_at desc);

create table public.scan_events (
  id bigint generated always as identity primary key,
  identifier_id uuid references public.public_identifiers (id) on delete cascade,
  person_id uuid references public.people (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  outcome public.scan_outcome not null
);
create index scan_events_person on public.scan_events (person_id, occurred_at desc);

-- ── Country registry ─────────────────────────────────────────────────────────
-- Never invent an emergency number: every row carries its official source,
-- verification date and review status. Only verified rows are ever shown.

create table public.emergency_numbers (
  id uuid primary key default gen_random_uuid(),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  service text not null check (service in ('general', 'police', 'medical', 'fire')),
  number text not null check (number ~ '^[0-9]{2,6}$'),
  source_url text not null check (source_url ~ '^https://'),
  verified_at date,
  review_status text not null default 'unverified'
    check (review_status in ('verified', 'unverified', 'retired')),
  notes text check (char_length(notes) <= 500),
  unique (country_code, service, number),
  check (review_status <> 'verified' or verified_at is not null)
);

-- ── Rate limiting state (private) ────────────────────────────────────────────

create table private.rate_limits (
  bucket text primary key,
  window_start timestamptz not null,
  hits integer not null
);

-- ── updated_at triggers ──────────────────────────────────────────────────────

create trigger set_updated_at before update on public.account_profiles
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.people
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.emergency_contacts
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.emergency_details
  for each row execute function private.set_updated_at();

-- ── Permission helpers ───────────────────────────────────────────────────────
-- SECURITY DEFINER so policies on person_members do not recurse into themselves.

create function private.has_role(p_person uuid, p_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.person_members
    where person_id = p_person
      and user_id = (select auth.uid())
      and role = any (p_roles)
  );
$$;

create function private.is_member(p_person uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role(p_person, enum_range(null::public.member_role));
$$;

create function private.can_edit(p_person uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role(p_person, array['owner', 'admin', 'caregiver']::public.member_role[]);
$$;

create function private.can_manage(p_person uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role(p_person, array['owner', 'admin']::public.member_role[]);
$$;

grant execute on function private.has_role(uuid, public.member_role[]) to authenticated;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.can_edit(uuid) to authenticated;
grant execute on function private.can_manage(uuid) to authenticated;

-- ── Row Level Security ───────────────────────────────────────────────────────

alter table public.account_profiles enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.people enable row level security;
alter table public.person_members enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.emergency_details enable row level security;
alter table public.public_identifiers enable row level security;
alter table public.consent_records enable row level security;
alter table public.invitations enable row level security;
alter table public.audit_logs enable row level security;
alter table public.scan_events enable row level security;
alter table public.emergency_numbers enable row level security;
alter table private.rate_limits enable row level security;

-- Start from zero: no table privileges for API roles, then grant explicitly.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- account_profiles: own row only.
grant select, update (display_name, preferred_locale) on public.account_profiles to authenticated;
create policy account_profiles_select_own on public.account_profiles
  for select to authenticated using (id = (select auth.uid()));
create policy account_profiles_update_own on public.account_profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- account_deletion_requests: read own; created through RPC.
grant select on public.account_deletion_requests to authenticated;
create policy deletion_requests_select_own on public.account_deletion_requests
  for select to authenticated using (user_id = (select auth.uid()));

-- people: members read; editors update allowed columns; created/deleted through RPC.
grant select on public.people to authenticated;
grant update (preferred_name, emergency_message, full_name, date_of_birth, preferred_locale, country_code)
  on public.people to authenticated;
create policy people_select_members on public.people
  for select to authenticated using ((select private.is_member(id)));
create policy people_update_editors on public.people
  for update to authenticated using ((select private.can_edit(id))) with check ((select private.can_edit(id)));

-- person_members: members see co-members; all changes through RPC.
grant select on public.person_members to authenticated;
create policy person_members_select_members on public.person_members
  for select to authenticated using ((select private.is_member(person_id)));

-- emergency_contacts / emergency_details: members read, editors write.
grant select, insert, delete on public.emergency_contacts to authenticated;
grant update (name, relationship, phone_e164, priority, visibility) on public.emergency_contacts to authenticated;
create policy emergency_contacts_select on public.emergency_contacts
  for select to authenticated using ((select private.is_member(person_id)));
create policy emergency_contacts_insert on public.emergency_contacts
  for insert to authenticated with check ((select private.can_edit(person_id)));
create policy emergency_contacts_update on public.emergency_contacts
  for update to authenticated using ((select private.can_edit(person_id)))
  with check ((select private.can_edit(person_id)));
create policy emergency_contacts_delete on public.emergency_contacts
  for delete to authenticated using ((select private.can_edit(person_id)));

grant select, insert, delete on public.emergency_details to authenticated;
grant update (kind, title, details, visibility, sort_order) on public.emergency_details to authenticated;
create policy emergency_details_select on public.emergency_details
  for select to authenticated using ((select private.is_member(person_id)));
create policy emergency_details_insert on public.emergency_details
  for insert to authenticated with check ((select private.can_edit(person_id)));
create policy emergency_details_update on public.emergency_details
  for update to authenticated using ((select private.can_edit(person_id)))
  with check ((select private.can_edit(person_id)));
create policy emergency_details_delete on public.emergency_details
  for delete to authenticated using ((select private.can_edit(person_id)));

-- public_identifiers / consent_records: members read; changes through RPC.
grant select on public.public_identifiers to authenticated;
create policy public_identifiers_select on public.public_identifiers
  for select to authenticated using ((select private.is_member(person_id)));

grant select on public.consent_records to authenticated;
create policy consent_records_select on public.consent_records
  for select to authenticated using ((select private.is_member(person_id)));

-- invitations (token hash excluded): managers read; changes through RPC.
grant select (id, person_id, email, role, invited_by, created_at, expires_at, accepted_at, accepted_by, revoked_at)
  on public.invitations to authenticated;
create policy invitations_select_managers on public.invitations
  for select to authenticated using ((select private.can_manage(person_id)));

-- audit_logs: managers read; written only by SECURITY DEFINER triggers.
grant select on public.audit_logs to authenticated;
create policy audit_logs_select_managers on public.audit_logs
  for select to authenticated using (person_id is not null and (select private.can_manage(person_id)));

-- scan_events: editors read; written only by the resolver.
grant select on public.scan_events to authenticated;
create policy scan_events_select_editors on public.scan_events
  for select to authenticated using (person_id is not null and (select private.can_edit(person_id)));

-- emergency_numbers: everyone may read verified rows.
grant select on public.emergency_numbers to anon, authenticated;
create policy emergency_numbers_select_verified on public.emergency_numbers
  for select to anon, authenticated using (review_status = 'verified');
