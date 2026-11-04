-- M3 read models, limits, ordering, invitations by link, activity and retention.
begin;
select plan(33);

-- ── Structural: every foreign key is backed by a full index ─────────────────
select is(
  (select coalesce(array_agg(c.conrelid::regclass::text || '.' || a.attname order by 1), '{}')
   from pg_constraint c
   join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
   where c.contype = 'f' and c.connamespace = 'public'::regnamespace
     and not exists (
       select 1 from pg_index i
       where i.indrelid = c.conrelid and i.indpred is null and i.indkey[0] = c.conkey[1]
     )),
  '{}'::text[],
  'every foreign key in public has a non-partial index on its column'
);

select is(
  (select count(*)::int from cron.job where jobname = 'vireluma-purge-expired-data'),
  1,
  'the retention job is scheduled'
);

select ok(
  not has_function_privilege('authenticated', 'private.purge_expired_data()', 'execute')
  and not has_function_privilege('anon', 'private.purge_expired_data()', 'execute'),
  'API roles cannot run the retention purge'
);

-- ── Fixtures ─────────────────────────────────────────────────────────────────
insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000004a1', 'owner4@example.test', now()),
  ('00000000-0000-0000-0000-0000000004b1', 'carer4@example.test', now()),
  ('00000000-0000-0000-0000-0000000004c1', 'viewer4@example.test', now()),
  ('00000000-0000-0000-0000-0000000004d1', 'outsider4@example.test', now()),
  ('00000000-0000-0000-0000-0000000004e1', 'invitee4@example.test', now());

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004a1","role":"authenticated"}', true);
set local role authenticated;
select set_config('test.person',
  public.create_person('Tomás', 'v1', p_is_minor => true, p_guardian_confirmed => true,
    p_country_code => 'CO')::text, true);

reset role;
insert into public.person_members (person_id, user_id, role) values
  (current_setting('test.person')::uuid, '00000000-0000-0000-0000-0000000004b1', 'caregiver'),
  (current_setting('test.person')::uuid, '00000000-0000-0000-0000-0000000004c1', 'viewer');

-- ── Dashboard ────────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004a1","role":"authenticated"}', true);
set local role authenticated;

select results_eq(
  $$ select preferred_name, role::text, active_public_id is null from public.list_my_people() $$,
  $$ values ('Tomás'::text, 'owner'::text, true) $$,
  'the owner sees their person without an identifier yet'
);

-- ── Limits and ordering ──────────────────────────────────────────────────────
insert into public.emergency_contacts (person_id, name, phone_e164, priority)
select current_setting('test.person')::uuid, 'Contact ' || g, '+57300000000' || (g - 1), g
from generate_series(1, 10) g;

select throws_ok(
  $$ insert into public.emergency_contacts (person_id, name, phone_e164)
     values (current_setting('test.person')::uuid, 'Eleventh', '+573001111111') $$,
  '54000', null, 'an eleventh contact is refused'
);

select throws_ok(
  $$ select public.reorder_emergency_contacts(current_setting('test.person')::uuid,
       (select array_agg(id) from (select id from public.emergency_contacts
        where person_id = current_setting('test.person')::uuid limit 9) x)) $$,
  '40001', null, 'reordering with a stale list is refused'
);

select lives_ok(
  $$ select public.reorder_emergency_contacts(current_setting('test.person')::uuid,
       (select array_agg(id order by priority desc) from public.emergency_contacts
        where person_id = current_setting('test.person')::uuid)) $$,
  'reordering with the complete list works'
);

select is(
  (select name from public.emergency_contacts
   where person_id = current_setting('test.person')::uuid and priority = 1),
  'Contact 10',
  'priorities follow the new order'
);

select is(
  (select contacts_count from public.list_my_people()),
  10,
  'the dashboard counts contacts'
);

select set_config('test.public_id', public.issue_public_identifier(current_setting('test.person')::uuid), true);

-- ── Workspace by role ────────────────────────────────────────────────────────
select set_config('test.ws', public.get_person_workspace(current_setting('test.person')::uuid)::text, true);
select is(current_setting('test.ws')::jsonb ->> 'my_role', 'owner', 'workspace reports my role');
select is(jsonb_array_length(current_setting('test.ws')::jsonb -> 'members'), 3, 'workspace lists members');
select is(
  current_setting('test.ws')::jsonb -> 'identifier' ->> 'public_id', current_setting('test.public_id'),
  'workspace includes the active identifier'
);
select ok(
  jsonb_typeof(current_setting('test.ws')::jsonb -> 'invitations') = 'array'
  and jsonb_typeof(current_setting('test.ws')::jsonb -> 'scans') = 'object',
  'managers get invitations and scan summary'
);

reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004c1","role":"authenticated"}', true);
set local role authenticated;
select set_config('test.ws', public.get_person_workspace(current_setting('test.person')::uuid)::text, true);
select ok(
  current_setting('test.ws')::jsonb -> 'invitations' = 'null'::jsonb
  and current_setting('test.ws')::jsonb -> 'scans' = 'null'::jsonb,
  'viewers get neither invitations nor scan data'
);
select is(
  (select last_scan_at from public.list_my_people()), null, 'viewers do not see scan times on the dashboard'
);
select throws_ok(
  $$ select public.get_person_activity(current_setting('test.person')::uuid) $$,
  '42501', null, 'viewers cannot read activity'
);

reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004d1","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ select public.get_person_workspace(current_setting('test.person')::uuid) $$,
  '42501', null, 'outsiders cannot open the workspace'
);
select is((select count(*)::int from public.list_my_people()), 0, 'outsiders see nobody on the dashboard');

-- ── Activity ─────────────────────────────────────────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004b1","role":"authenticated"}', true);
set local role authenticated;
select is(
  public.get_person_activity(current_setting('test.person')::uuid) -> 'audit', 'null'::jsonb,
  'caregivers see scans but not the audit trail'
);

reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004a1","role":"authenticated"}', true);
set local role authenticated;
select set_config('test.page1', public.get_person_activity(current_setting('test.person')::uuid, p_limit => 5)::text, true);
select is(jsonb_array_length(current_setting('test.page1')::jsonb -> 'audit'), 5, 'audit pages are limited');
select ok(
  (select bool_and((e ->> 'id')::bigint < ((current_setting('test.page1')::jsonb -> 'audit' -> 4 ->> 'id')::bigint))
   from jsonb_array_elements(public.get_person_activity(
     current_setting('test.person')::uuid,
     p_before_audit => (current_setting('test.page1')::jsonb -> 'audit' -> 4 ->> 'id')::bigint
   ) -> 'audit') e),
  'the next audit page continues strictly after the previous one'
);
select ok(
  current_setting('test.page1') not like '%Contact 1%' and current_setting('test.page1') not like '%+57300%',
  'the audit trail never contains values'
);

-- ── Invitations by link ──────────────────────────────────────────────────────
select set_config('test.token1', public.create_invitation(current_setting('test.person')::uuid, 'Invitee4@Example.test', 'viewer'), true);
select set_config('test.token2', public.create_invitation(current_setting('test.person')::uuid, 'invitee4@example.test', 'caregiver'), true);
select is(
  jsonb_array_length(public.get_person_workspace(current_setting('test.person')::uuid) -> 'invitations'), 1,
  'a new invitation to the same address replaces the pending one'
);
select throws_ok(
  $$ select public.create_invitation(current_setting('test.person')::uuid, 'carer4@example.test', 'viewer') $$,
  '23505', null, 'existing members cannot be invited again'
);

reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004d1","role":"authenticated"}', true);
set local role authenticated;
select is(
  public.preview_invitation(current_setting('test.token2')),
  '{"status":"wrong_account"}'::jsonb,
  'another account learns nothing about the invitation'
);

reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004e1","role":"authenticated"}', true);
set local role authenticated;
select is(public.preview_invitation(current_setting('test.token1')) ->> 'status', 'invalid', 'a replaced link is invalid');
select is(public.preview_invitation('not-a-token') ->> 'status', 'invalid', 'malformed tokens are invalid');
select is(
  public.preview_invitation(current_setting('test.token2')) - 'expires_at' - 'invited_by',
  '{"status":"valid","role":"caregiver","preferred_name":"Tomás"}'::jsonb,
  'the invitee sees who and which role they are accepting'
);
select is(
  public.accept_invitation(current_setting('test.token2')), current_setting('test.person')::uuid,
  'the invitee accepts'
);
select is(public.preview_invitation(current_setting('test.token2')) ->> 'status', 'used', 'a used link reports used');

-- ── Resolver and retention ───────────────────────────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
select is(
  public.resolve_emergency_profile(current_setting('test.public_id')) -> 'person' -> 'is_minor', 'true'::jsonb,
  'helpers are told when the person is a minor'
);

reset role;
insert into public.scan_events (person_id, occurred_at, outcome)
values (current_setting('test.person')::uuid, now() - interval '13 months', 'resolved');
select ok(
  (private.purge_expired_data() ->> 'scan_events')::int >= 1, 'the purge reports removed scan events'
);
-- Separate statement: a statement does not see rows deleted by a function it calls.
select ok(
  not exists (select 1 from public.scan_events where occurred_at < now() - interval '12 months'),
  'no scan event past retention remains'
);

select * from finish();
rollback;
