-- VIRELUMA — RPCs, the public emergency resolver and audit logging.
--
-- Every function is SECURITY DEFINER with an empty search_path and performs its
-- own authorization. EXECUTE is granted explicitly per function.

grant execute on function private.has_active_consent(uuid, public.consent_purpose) to authenticated;

-- ── Shared guards ────────────────────────────────────────────────────────────

create function private.require_user()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  return v_user;
end;
$$;

create function private.require_role(p_person uuid, p_roles public.member_role[])
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_user();
  if not private.has_role(p_person, p_roles) then
    -- Same error for "not found" and "not allowed": do not reveal existence.
    raise exception 'Not allowed' using errcode = '42501';
  end if;
end;
$$;

-- ── Audit ────────────────────────────────────────────────────────────────────

-- Records WHO did WHAT to WHICH entity. Stores changed column names only, never
-- values, so medical or personal data never reaches the audit trail.
create function private.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_changed jsonb := '[]'::jsonb;
  v_person uuid;
  v_entity_id text;
begin
  v_person := case
    when tg_table_name = 'people' then (v_row ->> 'id')::uuid
    else (v_row ->> 'person_id')::uuid
  end;
  v_entity_id := coalesce(v_row ->> 'id', v_row ->> 'user_id');

  if tg_op = 'UPDATE' then
    select coalesce(jsonb_agg(key order by key), '[]'::jsonb) into v_changed
    from jsonb_each(v_new) n
    where key not in ('updated_at') and n.value is distinct from v_old -> key;
    if v_changed = '[]'::jsonb then
      return null;
    end if;
  end if;

  insert into public.audit_logs (actor_id, person_id, action, entity, entity_id, details)
  values (
    (select auth.uid()),
    -- On person deletion keep the id for traceability (no FK by design).
    v_person,
    lower(tg_op),
    tg_table_name,
    v_entity_id,
    case when tg_op = 'UPDATE' then jsonb_build_object('changed', v_changed) else '{}'::jsonb end
  );
  return null;
end;
$$;

create trigger audit after insert or update or delete on public.people
  for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.person_members
  for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.emergency_contacts
  for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.emergency_details
  for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.public_identifiers
  for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.consent_records
  for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.invitations
  for each row execute function private.audit_row();

-- ── People ───────────────────────────────────────────────────────────────────

create function public.create_person(
  p_preferred_name text,
  p_policy_version text,
  p_is_minor boolean default false,
  p_guardian_confirmed boolean default false,
  p_full_name text default null,
  p_date_of_birth date default null,
  p_preferred_locale text default 'es',
  p_country_code text default null,
  p_emergency_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := private.require_user();
  v_person uuid;
begin
  if p_is_minor and not coalesce(p_guardian_confirmed, false) then
    raise exception 'Only a parent or legal guardian can create a profile for a minor'
      using errcode = 'check_violation';
  end if;

  if (select count(*) from public.person_members where user_id = v_user and role = 'owner') >= 50 then
    raise exception 'Too many profiles for one account' using errcode = '54000';
  end if;

  insert into public.people (
    preferred_name, full_name, date_of_birth, is_minor, preferred_locale, country_code,
    emergency_message, created_by
  )
  values (
    btrim(p_preferred_name), p_full_name, p_date_of_birth, p_is_minor, p_preferred_locale,
    p_country_code, p_emergency_message, v_user
  )
  returning id into v_person;

  insert into public.person_members (person_id, user_id, role, added_by)
  values (v_person, v_user, 'owner', v_user);

  insert into public.consent_records (person_id, purpose, policy_version, granted_by)
  values (v_person, 'profile_processing', p_policy_version, v_user);

  if p_is_minor then
    insert into public.consent_records (person_id, purpose, policy_version, granted_by)
    values (v_person, 'minor_guardian', p_policy_version, v_user);
  end if;

  return v_person;
end;
$$;

create function public.set_person_status(p_person uuid, p_status public.person_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_role(p_person, array['owner']::public.member_role[]);
  update public.people set status = p_status where id = p_person;
end;
$$;

create function public.delete_person(p_person uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_role(p_person, array['owner']::public.member_role[]);
  delete from public.people where id = p_person;
end;
$$;

-- ── Public identifiers ───────────────────────────────────────────────────────

-- Issues a new identifier, revoking the current one. Printed codes using the
-- old identifier stop resolving (status 'revoked') — use when a tag is lost.
create function public.issue_public_identifier(p_person uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := private.require_user();
  v_public_id text;
begin
  perform private.require_role(p_person, array['owner', 'admin']::public.member_role[]);
  if (select status from public.people where id = p_person) <> 'active' then
    raise exception 'Person is suspended' using errcode = 'check_violation';
  end if;

  update public.public_identifiers
  set status = 'revoked', revoked_at = now(), revoked_by = v_user, revoked_reason = 'replaced'
  where person_id = p_person and status = 'active';

  insert into public.public_identifiers (person_id, issued_by)
  values (p_person, v_user)
  returning public_id into v_public_id;

  return v_public_id;
end;
$$;

create function public.revoke_public_identifier(p_identifier uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_person uuid;
begin
  select person_id into v_person from public.public_identifiers where id = p_identifier;
  perform private.require_role(v_person, array['owner', 'admin']::public.member_role[]);
  update public.public_identifiers
  set status = 'revoked', revoked_at = now(), revoked_by = (select auth.uid()),
      revoked_reason = left(p_reason, 200)
  where id = p_identifier and status = 'active';
end;
$$;

-- ── Consent ──────────────────────────────────────────────────────────────────

create function public.grant_consent(p_person uuid, p_purpose public.consent_purpose, p_policy_version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_role(p_person, array['owner']::public.member_role[]);
  insert into public.consent_records (person_id, purpose, policy_version, granted_by)
  values (p_person, p_purpose, p_policy_version, (select auth.uid()))
  on conflict (person_id, purpose) where revoked_at is null do nothing;
end;
$$;

-- Revoking health-data consent deletes the health details it covered.
create function public.revoke_consent(p_person uuid, p_purpose public.consent_purpose)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_role(p_person, array['owner']::public.member_role[]);
  if p_purpose = 'profile_processing' then
    raise exception 'Delete the person instead of revoking profile processing consent'
      using errcode = 'check_violation';
  end if;
  update public.consent_records
  set revoked_at = now(), revoked_by = (select auth.uid())
  where person_id = p_person and purpose = p_purpose and revoked_at is null;
  if p_purpose = 'health_data' then
    delete from public.emergency_details
    where person_id = p_person and kind in ('medical_alert', 'allergy', 'medication');
  end if;
end;
$$;

-- ── Invitations and membership ───────────────────────────────────────────────

-- Returns the invitation token ONCE. Only its SHA-256 is stored.
create function public.create_invitation(p_person uuid, p_email text, p_role public.member_role)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := private.require_user();
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  perform private.require_role(p_person, array['owner', 'admin']::public.member_role[]);
  if p_role = 'owner' then
    raise exception 'Ownership is transferred, not invited' using errcode = 'check_violation';
  end if;
  if p_role = 'admin' and not private.has_role(p_person, array['owner']::public.member_role[]) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  insert into public.invitations (person_id, email, role, token_hash, invited_by)
  values (p_person, lower(btrim(p_email)), p_role, extensions.digest(v_token, 'sha256'), v_user);
  return v_token;
end;
$$;

create function public.revoke_invitation(p_invitation uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_person uuid;
begin
  select person_id into v_person from public.invitations where id = p_invitation;
  perform private.require_role(v_person, array['owner', 'admin']::public.member_role[]);
  update public.invitations set revoked_at = now()
  where id = p_invitation and accepted_at is null and revoked_at is null;
end;
$$;

-- The invitation must be addressed to the signed-in account's confirmed email.
create function public.accept_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := private.require_user();
  v_email text;
  v_invitation public.invitations%rowtype;
begin
  select lower(email) into v_email from auth.users where id = v_user and email_confirmed_at is not null;

  select * into v_invitation from public.invitations
  where token_hash = extensions.digest(coalesce(p_token, ''), 'sha256')
    and accepted_at is null and revoked_at is null and expires_at > now()
  for update;

  if v_invitation.id is null or v_email is null or v_invitation.email <> v_email then
    raise exception 'Invitation not valid' using errcode = '42501';
  end if;
  if exists (select 1 from public.person_members where person_id = v_invitation.person_id and user_id = v_user) then
    raise exception 'Already a member' using errcode = 'unique_violation';
  end if;

  insert into public.person_members (person_id, user_id, role, added_by)
  values (v_invitation.person_id, v_user, v_invitation.role, v_invitation.invited_by);
  update public.invitations set accepted_at = now(), accepted_by = v_user where id = v_invitation.id;
  return v_invitation.person_id;
end;
$$;

create function public.update_member_role(p_person uuid, p_user uuid, p_role public.member_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current public.member_role;
  v_is_owner boolean;
begin
  perform private.require_role(p_person, array['owner', 'admin']::public.member_role[]);
  v_is_owner := private.has_role(p_person, array['owner']::public.member_role[]);
  select role into v_current from public.person_members where person_id = p_person and user_id = p_user;

  if v_current is null then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if p_role = 'owner' or v_current = 'owner' then
    raise exception 'Use transfer_ownership' using errcode = 'check_violation';
  end if;
  -- Only the owner can grant or take away the admin role.
  if (p_role = 'admin' or v_current = 'admin') and not v_is_owner then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  update public.person_members set role = p_role where person_id = p_person and user_id = p_user;
end;
$$;

-- Managers remove members; anyone except the owner may leave.
create function public.remove_member(p_person uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := private.require_user();
  v_target public.member_role;
begin
  select role into v_target from public.person_members where person_id = p_person and user_id = p_user;
  if v_target is null or not private.is_member(p_person) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if v_target = 'owner' then
    raise exception 'Transfer ownership before leaving' using errcode = 'check_violation';
  end if;
  if p_user <> v_me then
    if not private.can_manage(p_person) then
      raise exception 'Not allowed' using errcode = '42501';
    end if;
    if v_target = 'admin' and not private.has_role(p_person, array['owner']::public.member_role[]) then
      raise exception 'Not allowed' using errcode = '42501';
    end if;
  end if;
  delete from public.person_members where person_id = p_person and user_id = p_user;
end;
$$;

create function public.transfer_ownership(p_person uuid, p_new_owner uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := private.require_user();
begin
  perform private.require_role(p_person, array['owner']::public.member_role[]);
  if p_new_owner = v_me
     or not exists (select 1 from public.person_members where person_id = p_person and user_id = p_new_owner) then
    raise exception 'New owner must be another existing member' using errcode = 'check_violation';
  end if;
  update public.person_members set role = 'admin' where person_id = p_person and user_id = v_me;
  update public.person_members set role = 'owner' where person_id = p_person and user_id = p_new_owner;
end;
$$;

-- ── Account ──────────────────────────────────────────────────────────────────

-- Records the request; processing (ownership hand-over, deletion, retention)
-- is an operator workflow documented in docs/privacy/data-retention.md.
create function public.request_account_deletion()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := private.require_user();
  v_id uuid;
begin
  insert into public.account_deletion_requests (user_id) values (v_user)
  on conflict (user_id) where status = 'pending' do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.account_deletion_requests where user_id = v_user and status = 'pending';
  end if;
  return v_id;
end;
$$;

-- ── Public emergency resolver ────────────────────────────────────────────────

create function private.take_rate_limit(p_bucket text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := date_trunc('minute', now());
  v_hits integer;
begin
  insert into private.rate_limits as r (bucket, window_start, hits)
  values (p_bucket, v_window, 1)
  on conflict (bucket) do update
    set hits = case when r.window_start = excluded.window_start then r.hits + 1 else 1 end,
        window_start = excluded.window_start
  returning hits into v_hits;
  return v_hits <= p_limit;
end;
$$;

-- The ONLY way anonymous users read profile data. Returns fields marked
-- `public_emergency` for an active identifier, nothing else. Must be called with
-- POST (it is VOLATILE), so identifiers never appear in URLs or access logs.
create function public.resolve_emergency_profile(p_public_id text)
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
    -- Unknown identifiers share one global budget; legitimate codes are unaffected.
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
      'country_code', v_person.country_code
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

-- ── Grants ───────────────────────────────────────────────────────────────────

revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.resolve_emergency_profile(text) to anon, authenticated;

grant execute on function public.create_person(text, text, boolean, boolean, text, date, text, text, text) to authenticated;
grant execute on function public.set_person_status(uuid, public.person_status) to authenticated;
grant execute on function public.delete_person(uuid) to authenticated;
grant execute on function public.issue_public_identifier(uuid) to authenticated;
grant execute on function public.revoke_public_identifier(uuid, text) to authenticated;
grant execute on function public.grant_consent(uuid, public.consent_purpose, text) to authenticated;
grant execute on function public.revoke_consent(uuid, public.consent_purpose) to authenticated;
grant execute on function public.create_invitation(uuid, text, public.member_role) to authenticated;
grant execute on function public.revoke_invitation(uuid) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.update_member_role(uuid, uuid, public.member_role) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
grant execute on function public.transfer_ownership(uuid, uuid) to authenticated;
grant execute on function public.request_account_deletion() to authenticated;
