-- VIRELUMA — M3 core product: read models, limits, invitations by link,
-- reordering, activity paging and data retention.
--
-- Design notes (see docs/architecture/database.md):
-- * Each app screen reads through ONE SECURITY DEFINER function that checks
--   membership itself and returns everything the screen needs (one round trip
--   on slow mobile networks, no N+1 from the browser).
-- * Writes stay on RLS-guarded tables or on the RPCs from the previous migration.
-- * Every foreign key is backed by an index (cascades and joins stay cheap as
--   tables grow); 004_core_product.test.sql enforces it for future migrations.

-- ── Foreign-key indexes ──────────────────────────────────────────────────────

create index account_deletion_requests_user on public.account_deletion_requests (user_id);
create index people_created_by on public.people (created_by);
create index person_members_added_by on public.person_members (added_by);
create index public_identifiers_person on public.public_identifiers (person_id, issued_at desc);
create index public_identifiers_issued_by on public.public_identifiers (issued_by);
create index public_identifiers_revoked_by on public.public_identifiers (revoked_by);
create index consent_records_person on public.consent_records (person_id, granted_at desc);
create index consent_records_granted_by on public.consent_records (granted_by);
create index consent_records_revoked_by on public.consent_records (revoked_by);
create index invitations_invited_by on public.invitations (invited_by);
create index invitations_accepted_by on public.invitations (accepted_by);
create index scan_events_identifier on public.scan_events (identifier_id);

-- ── Size limits per person ───────────────────────────────────────────────────
-- Bounded children keep the public resolver payload small and stop abuse of
-- the free tier. The parent row is locked so concurrent inserts cannot race
-- past the limit.

create function private.enforce_child_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer := tg_argv[0]::integer;
  v_count integer;
begin
  perform 1 from public.people where id = new.person_id for update;
  execute format('select count(*) from public.%I where person_id = $1', tg_table_name)
    into v_count using new.person_id;
  if v_count >= v_limit then
    raise exception 'Limit of % reached for %', v_limit, tg_table_name using errcode = '54000';
  end if;
  return new;
end;
$$;

create trigger emergency_contacts_limit before insert on public.emergency_contacts
  for each row execute function private.enforce_child_limit('10');
create trigger emergency_details_limit before insert on public.emergency_details
  for each row execute function private.enforce_child_limit('30');

-- ── Dashboard: the people this account can see ───────────────────────────────

create function public.list_my_people()
returns table (
  id uuid,
  preferred_name text,
  status public.person_status,
  role public.member_role,
  is_minor boolean,
  country_code text,
  contacts_count integer,
  public_contacts_count integer,
  details_count integer,
  active_public_id text,
  identifier_issued_at timestamptz,
  last_scan_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.preferred_name,
    p.status,
    m.role,
    p.is_minor,
    p.country_code,
    (select count(*)::integer from public.emergency_contacts c where c.person_id = p.id),
    (select count(*)::integer from public.emergency_contacts c
      where c.person_id = p.id and c.visibility = 'public_emergency'),
    (select count(*)::integer from public.emergency_details d where d.person_id = p.id),
    i.public_id,
    i.issued_at,
    -- Scan history is visible to editors only (same rule as scan_events RLS).
    case when m.role in ('owner', 'admin', 'caregiver') then
      (select max(s.occurred_at) from public.scan_events s
        where s.person_id = p.id and s.outcome = 'resolved')
    end,
    p.updated_at
  from public.person_members m
  join public.people p on p.id = m.person_id
  left join public.public_identifiers i on i.person_id = p.id and i.status = 'active'
  where m.user_id = (select auth.uid())
  order by p.preferred_name, p.id
  limit 200;
$$;

-- ── Person workspace: everything one person's screen needs ──────────────────

create function public.get_person_workspace(p_person uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := private.require_user();
  v_role public.member_role;
  v_editor boolean;
  v_manager boolean;
begin
  select role into v_role from public.person_members where person_id = p_person and user_id = v_me;
  if v_role is null then
    -- Same error for "not found" and "not allowed": do not reveal existence.
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  v_editor := v_role in ('owner', 'admin', 'caregiver');
  v_manager := v_role in ('owner', 'admin');

  return jsonb_build_object(
    'my_role', v_role,
    'person', (
      select jsonb_build_object(
        'id', p.id, 'preferred_name', p.preferred_name, 'full_name', p.full_name,
        'date_of_birth', p.date_of_birth, 'is_minor', p.is_minor,
        'preferred_locale', p.preferred_locale, 'country_code', p.country_code,
        'emergency_message', p.emergency_message, 'status', p.status,
        'created_at', p.created_at, 'updated_at', p.updated_at
      )
      from public.people p where p.id = p_person
    ),
    'contacts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'relationship', c.relationship, 'phone_e164', c.phone_e164,
        'priority', c.priority, 'visibility', c.visibility
      ) order by c.priority, c.created_at)
      from public.emergency_contacts c where c.person_id = p_person
    ), '[]'::jsonb),
    'details', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id, 'kind', d.kind, 'title', d.title, 'details', d.details,
        'visibility', d.visibility, 'sort_order', d.sort_order
      ) order by d.sort_order, d.created_at)
      from public.emergency_details d where d.person_id = p_person
    ), '[]'::jsonb),
    'identifier', (
      select jsonb_build_object('id', i.id, 'public_id', i.public_id, 'issued_at', i.issued_at)
      from public.public_identifiers i where i.person_id = p_person and i.status = 'active'
    ),
    'revoked_identifiers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'issued_at', r.issued_at, 'revoked_at', r.revoked_at, 'reason', r.revoked_reason
      ) order by r.revoked_at desc)
      from (
        select * from public.public_identifiers
        where person_id = p_person and status = 'revoked'
        order by revoked_at desc limit 5
      ) r
    ), '[]'::jsonb),
    'consents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'purpose', c.purpose, 'policy_version', c.policy_version, 'granted_at', c.granted_at
      ) order by c.purpose)
      from public.consent_records c where c.person_id = p_person and c.revoked_at is null
    ), '[]'::jsonb),
    -- Co-members see each other's email so a family knows who has access.
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', m.user_id, 'role', m.role, 'email', u.email,
        'display_name', a.display_name, 'since', m.created_at, 'is_me', m.user_id = v_me
      ) order by m.role, m.created_at)
      from public.person_members m
      left join auth.users u on u.id = m.user_id
      left join public.account_profiles a on a.id = m.user_id
      where m.person_id = p_person
    ), '[]'::jsonb),
    'invitations', case when v_manager then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'email', i.email, 'role', i.role, 'created_at', i.created_at,
        'expires_at', i.expires_at
      ) order by i.created_at desc)
      from public.invitations i
      where i.person_id = p_person and i.accepted_at is null and i.revoked_at is null
        and i.expires_at > now()
    ), '[]'::jsonb) end,
    'scans', case when v_editor then (
      select jsonb_build_object(
        'last_30_days', count(*) filter (where s.occurred_at > now() - interval '30 days'),
        'last_scan_at', max(s.occurred_at)
      )
      from public.scan_events s where s.person_id = p_person and s.outcome = 'resolved'
    ) end
  );
end;
$$;

-- ── Activity: audit trail (managers) and scans (editors), keyset paginated ──

create function public.get_person_activity(
  p_person uuid,
  p_before_audit bigint default null,
  p_before_scan bigint default null,
  p_limit integer default 25
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := private.require_user();
  v_role public.member_role;
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 100);
begin
  select role into v_role from public.person_members where person_id = p_person and user_id = v_me;
  if v_role is null or v_role not in ('owner', 'admin', 'caregiver') then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'audit', case when v_role in ('owner', 'admin') then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id, 'at', l.occurred_at, 'action', l.action, 'entity', l.entity,
        'changed', l.details -> 'changed',
        -- Name the actor only while they are still a member.
        'actor_email', (
          select u.email from public.person_members pm join auth.users u on u.id = pm.user_id
          where pm.person_id = p_person and pm.user_id = l.actor_id
        ),
        'by_me', l.actor_id = v_me
      ) order by l.id desc)
      from (
        select * from public.audit_logs
        where person_id = p_person and (p_before_audit is null or id < p_before_audit)
        order by id desc limit v_limit
      ) l
    ), '[]'::jsonb) end,
    'scans', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'at', s.occurred_at, 'outcome', s.outcome)
        order by s.id desc)
      from (
        select * from public.scan_events
        where person_id = p_person and (p_before_scan is null or id < p_before_scan)
        order by id desc limit v_limit
      ) s
    ), '[]'::jsonb)
  );
end;
$$;

create index audit_logs_person_id on public.audit_logs (person_id, id desc);
create index scan_events_person_id on public.scan_events (person_id, id desc);
drop index public.audit_logs_person;
drop index public.scan_events_person;

-- ── Ordering ─────────────────────────────────────────────────────────────────

-- Rewrites priorities 1..n in the given order. Ids must be exactly the
-- person's contacts, so a stale screen cannot silently drop one.
create function public.reorder_emergency_contacts(p_person uuid, p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_role(p_person, array['owner', 'admin', 'caregiver']::public.member_role[]);
  if (select array_agg(id order by id) from public.emergency_contacts where person_id = p_person)
     is distinct from (select array_agg(x order by x) from unnest(p_ids) x) then
    raise exception 'Contact list changed, reload and try again' using errcode = '40001';
  end if;
  update public.emergency_contacts c set priority = o.ord
  from unnest(p_ids) with ordinality as o(id, ord)
  where c.id = o.id and c.priority is distinct from o.ord::smallint;
end;
$$;

create function public.reorder_emergency_details(p_person uuid, p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_role(p_person, array['owner', 'admin', 'caregiver']::public.member_role[]);
  if (select array_agg(id order by id) from public.emergency_details where person_id = p_person)
     is distinct from (select array_agg(x order by x) from unnest(p_ids) x) then
    raise exception 'Detail list changed, reload and try again' using errcode = '40001';
  end if;
  update public.emergency_details d set sort_order = o.ord
  from unnest(p_ids) with ordinality as o(id, ord)
  where d.id = o.id and d.sort_order is distinct from o.ord::smallint;
end;
$$;

-- ── Invitations by link ──────────────────────────────────────────────────────
-- No email provider is required: the inviter shares a one-time link
-- (`/app/invite/#token`, the token stays in the fragment). The invitation is
-- still bound to the invitee's confirmed email.

create or replace function public.create_invitation(p_person uuid, p_email text, p_role public.member_role)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := private.require_user();
  v_email text := lower(btrim(p_email));
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  perform private.require_role(p_person, array['owner', 'admin']::public.member_role[]);
  if p_role = 'owner' then
    raise exception 'Ownership is transferred, not invited' using errcode = 'check_violation';
  end if;
  if p_role = 'admin' and not private.has_role(p_person, array['owner']::public.member_role[]) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.person_members m join auth.users u on u.id = m.user_id
    where m.person_id = p_person and lower(u.email) = v_email
  ) then
    raise exception 'Already a member' using errcode = 'unique_violation';
  end if;

  -- A new invitation to the same address replaces the pending one.
  update public.invitations set revoked_at = now()
  where person_id = p_person and email = v_email and accepted_at is null and revoked_at is null;

  if (select count(*) from public.invitations
      where person_id = p_person and accepted_at is null and revoked_at is null and expires_at > now()) >= 20 then
    raise exception 'Too many pending invitations' using errcode = '54000';
  end if;

  insert into public.invitations (person_id, email, role, token_hash, invited_by)
  values (p_person, v_email, p_role, extensions.digest(v_token, 'sha256'), v_user);
  return v_token;
end;
$$;

-- Tells the invitee what they are about to accept. Details are returned only
-- when the invitation is addressed to the signed-in account.
create function public.preview_invitation(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := private.require_user();
  v_email text;
  v_invitation public.invitations%rowtype;
begin
  if not private.take_rate_limit('invite:' || v_user, 30) then
    return jsonb_build_object('status', 'rate_limited');
  end if;
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('status', 'invalid');
  end if;

  select lower(email) into v_email from auth.users where id = v_user and email_confirmed_at is not null;
  select * into v_invitation from public.invitations
  where token_hash = extensions.digest(p_token, 'sha256');

  if v_invitation.id is null or v_invitation.revoked_at is not null then
    return jsonb_build_object('status', 'invalid');
  end if;
  if v_invitation.accepted_at is not null then
    return jsonb_build_object('status', 'used');
  end if;
  if v_invitation.expires_at <= now() then
    return jsonb_build_object('status', 'expired');
  end if;
  if v_email is null or v_email <> v_invitation.email then
    return jsonb_build_object('status', 'wrong_account');
  end if;
  if exists (select 1 from public.person_members where person_id = v_invitation.person_id and user_id = v_user) then
    return jsonb_build_object('status', 'already_member', 'person_id', v_invitation.person_id);
  end if;

  return jsonb_build_object(
    'status', 'valid',
    'role', v_invitation.role,
    'expires_at', v_invitation.expires_at,
    'preferred_name', (select preferred_name from public.people where id = v_invitation.person_id),
    'invited_by', (select email from auth.users where id = v_invitation.invited_by)
  );
end;
$$;

-- ── Public resolver: also tell helpers when the person is a minor ───────────

create or replace function public.resolve_emergency_profile(p_public_id text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id text := private.normalize_public_id(p_public_id);
  v_identifier public.public_identifiers%rowtype;
  v_person public.people%rowtype;
begin
  if v_id is null then
    return jsonb_build_object('status', 'invalid');
  end if;

  select * into v_identifier from public.public_identifiers where public_id = v_id;

  if v_identifier.id is null then
    if not private.take_rate_limit('resolve:not_found', 600) then
      insert into public.scan_events (outcome) values ('rate_limited');
      return jsonb_build_object('status', 'rate_limited');
    end if;
    insert into public.scan_events (outcome) values ('not_found');
    return jsonb_build_object('status', 'not_found');
  end if;

  if not private.take_rate_limit('resolve:' || v_identifier.id, 120) then
    insert into public.scan_events (identifier_id, person_id, outcome)
    values (v_identifier.id, v_identifier.person_id, 'rate_limited');
    return jsonb_build_object('status', 'rate_limited');
  end if;

  if v_identifier.status = 'revoked' then
    insert into public.scan_events (identifier_id, person_id, outcome)
    values (v_identifier.id, v_identifier.person_id, 'revoked');
    return jsonb_build_object('status', 'revoked');
  end if;

  select * into v_person from public.people where id = v_identifier.person_id;
  if v_person.status <> 'active' then
    insert into public.scan_events (identifier_id, person_id, outcome)
    values (v_identifier.id, v_person.id, 'suspended');
    return jsonb_build_object('status', 'suspended');
  end if;

  insert into public.scan_events (identifier_id, person_id, outcome)
  values (v_identifier.id, v_person.id, 'resolved');

  return jsonb_build_object(
    'status', 'active',
    'person', jsonb_build_object(
      'preferred_name', v_person.preferred_name,
      'emergency_message', v_person.emergency_message,
      'preferred_locale', v_person.preferred_locale,
      'country_code', v_person.country_code,
      'is_minor', v_person.is_minor
    ),
    'contacts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', c.name, 'relationship', c.relationship, 'phone', c.phone_e164
      ) order by c.priority, c.created_at)
      from public.emergency_contacts c
      where c.person_id = v_person.id and c.visibility = 'public_emergency'
    ), '[]'::jsonb),
    'details', coalesce((
      select jsonb_agg(jsonb_build_object(
        'kind', d.kind, 'title', d.title, 'details', d.details
      ) order by d.sort_order, d.created_at)
      from public.emergency_details d
      where d.person_id = v_person.id and d.visibility = 'public_emergency'
    ), '[]'::jsonb),
    'emergency_numbers', coalesce((
      select jsonb_agg(jsonb_build_object('service', n.service, 'number', n.number) order by n.service)
      from public.emergency_numbers n
      where n.country_code = v_person.country_code and n.review_status = 'verified'
    ), '[]'::jsonb)
  );
end;
$$;

-- ── Retention (periods are drafts pending legal review, data-retention.md) ──

create function private.purge_expired_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scans integer;
  v_audit integer;
  v_invitations integer;
  v_limits integer;
begin
  delete from public.scan_events where occurred_at < now() - interval '12 months';
  get diagnostics v_scans = row_count;
  delete from public.audit_logs where occurred_at < now() - interval '24 months';
  get diagnostics v_audit = row_count;
  delete from public.invitations
  where coalesce(accepted_at, revoked_at, expires_at) < now() - interval '90 days';
  get diagnostics v_invitations = row_count;
  delete from private.rate_limits where window_start < now() - interval '1 hour';
  get diagnostics v_limits = row_count;
  return jsonb_build_object(
    'scan_events', v_scans, 'audit_logs', v_audit, 'invitations', v_invitations, 'rate_limits', v_limits
  );
end;
$$;

revoke execute on function private.purge_expired_data() from public;

-- Daily at 03:17 UTC. pg_cron ships with Supabase Postgres (local and cloud).
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('vireluma-purge-expired-data', '17 3 * * *', 'select private.purge_expired_data()');

-- ── Grants ───────────────────────────────────────────────────────────────────

revoke execute on all functions in schema public from public, anon;
revoke execute on function private.enforce_child_limit() from public;

grant execute on function public.list_my_people() to authenticated;
grant execute on function public.get_person_workspace(uuid) to authenticated;
grant execute on function public.get_person_activity(uuid, bigint, bigint, integer) to authenticated;
grant execute on function public.reorder_emergency_contacts(uuid, uuid[]) to authenticated;
grant execute on function public.reorder_emergency_details(uuid, uuid[]) to authenticated;
grant execute on function public.preview_invitation(text) to authenticated;
grant execute on function public.resolve_emergency_profile(text) to anon, authenticated;
