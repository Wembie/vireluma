-- Access-control matrix: owner, caregiver, viewer, another family and anon.
-- IDs are passed between role switches through transaction-local settings.
begin;
select plan(30);

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-00000000000a', 'owner@example.test', now()),
  ('00000000-0000-0000-0000-00000000000b', 'stranger@example.test', now()),
  ('00000000-0000-0000-0000-00000000000c', 'caregiver@example.test', now()),
  ('00000000-0000-0000-0000-00000000000d', 'viewer@example.test', now());

select is(
  (select count(*)::int from public.account_profiles where id::text like '00000000-0000-0000-0000-00000000000_'),
  4,
  'account profiles are created on sign-up'
);

-- ── Owner creates a person ───────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
set local role authenticated;

select set_config('test.person', public.create_person('Elena', 'v1', p_full_name => 'Elena Ruiz')::text, true);
select is((select count(*)::int from public.people), 1, 'owner sees the person they created');
select is(
  (select role::text from public.person_members where person_id = current_setting('test.person')::uuid),
  'owner',
  'creator becomes owner'
);
select is(
  (select count(*)::int from public.consent_records where purpose = 'profile_processing'),
  1,
  'profile processing consent is recorded at creation'
);

select throws_ok(
  $$ select public.create_person('Child', 'v1', p_is_minor => true) $$,
  '23514', null,
  'a minor profile requires guardian confirmation'
);

select lives_ok(
  $$ insert into public.emergency_contacts (person_id, name, relationship, phone_e164)
     values (current_setting('test.person')::uuid, 'María', 'Hija', '+573001234567') $$,
  'owner adds an emergency contact'
);

select throws_ok(
  $$ insert into public.emergency_details (person_id, kind, title)
     values (current_setting('test.person')::uuid, 'allergy', 'Penicilina') $$,
  '23514', null,
  'health details are rejected without health-data consent'
);

select lives_ok(
  $$ select public.grant_consent(current_setting('test.person')::uuid, 'health_data', 'v1') $$,
  'owner grants health-data consent'
);
select lives_ok(
  $$ insert into public.emergency_details (person_id, kind, title, visibility)
     values (current_setting('test.person')::uuid, 'allergy', 'Penicilina', 'public_emergency') $$,
  'health details are accepted with consent'
);

select throws_ok(
  $$ update public.people set status = 'suspended' where id = current_setting('test.person')::uuid $$,
  '42501', null,
  'status cannot be changed by direct update (column privilege)'
);

select set_config('test.caregiver_token',
  public.create_invitation(current_setting('test.person')::uuid, 'Caregiver@Example.test', 'caregiver'), true);
select set_config('test.viewer_token',
  public.create_invitation(current_setting('test.person')::uuid, 'viewer@example.test', 'viewer'), true);

-- ── Another family ───────────────────────────────────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.people), 0, 'another family cannot see the person');
select is((select count(*)::int from public.emergency_contacts), 0, 'another family cannot see contacts');
select is((select count(*)::int from public.emergency_details), 0, 'another family cannot see details');
with u as (update public.people set preferred_name = 'Hacked' where id = current_setting('test.person')::uuid returning 1)
select is(count(*)::int, 0, 'another family cannot update the person') from u;
select throws_ok(
  $$ insert into public.emergency_contacts (person_id, name, phone_e164)
     values (current_setting('test.person')::uuid, 'Intruder', '+15555550100') $$,
  '42501', null,
  'another family cannot add contacts'
);
select throws_ok(
  $$ select public.issue_public_identifier(current_setting('test.person')::uuid) $$,
  '42501', null,
  'another family cannot issue identifiers'
);
select throws_ok(
  $$ select public.accept_invitation(current_setting('test.caregiver_token')) $$,
  '42501', null,
  'an invitation cannot be accepted by a different email'
);
select is((select count(*)::int from public.audit_logs), 0, 'another family cannot read the audit trail');

-- ── Caregiver ────────────────────────────────────────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
set local role authenticated;

select is(
  public.accept_invitation(current_setting('test.caregiver_token')),
  current_setting('test.person')::uuid,
  'caregiver accepts an invitation addressed to their email'
);
select is((select count(*)::int from public.people), 1, 'caregiver can see the person');
select lives_ok(
  $$ update public.emergency_contacts set relationship = 'Daughter'
     where person_id = current_setting('test.person')::uuid $$,
  'caregiver can edit emergency contacts'
);
select throws_ok(
  $$ select public.create_invitation(current_setting('test.person')::uuid, 'x@example.test', 'viewer') $$,
  '42501', null,
  'caregiver cannot invite members'
);
select throws_ok(
  $$ select public.issue_public_identifier(current_setting('test.person')::uuid) $$,
  '42501', null,
  'caregiver cannot issue identifiers'
);
select is((select count(*)::int from public.audit_logs), 0, 'caregiver cannot read the audit trail');

-- ── Viewer ───────────────────────────────────────────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
set local role authenticated;

select lives_ok($$ select public.accept_invitation(current_setting('test.viewer_token')) $$, 'viewer joins');
with u as (update public.emergency_contacts set name = 'X' where person_id = current_setting('test.person')::uuid returning 1)
select is(count(*)::int, 0, 'viewer cannot edit contacts') from u;

-- ── Owner manages membership ─────────────────────────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$ select public.remove_member(current_setting('test.person')::uuid, '00000000-0000-0000-0000-00000000000d') $$,
  'owner removes the viewer'
);
select ok(
  (select count(*) from public.audit_logs where entity = 'emergency_contacts' and action = 'update') >= 1
  and not exists (select 1 from public.audit_logs where details::text like '%Daughter%' or details::text like '%Penicilina%'),
  'audit trail records changes without personal or medical values'
);

reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.people), 0, 'a removed member loses access immediately');

-- ── Anonymous ────────────────────────────────────────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
select throws_ok($$ select * from public.people $$, '42501', null, 'anon cannot read people');

select * from finish();
rollback;
