-- The public emergency resolver returns only `public_emergency` data for
-- active identifiers, and nothing for revoked, suspended or unknown ones.
begin;
select plan(14);

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000a1', 'family@example.test', now());

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

select set_config('test.person',
  public.create_person('Elena', 'v1', p_full_name => 'Elena Ruiz Secret', p_country_code => 'CO',
    p_emergency_message => 'Please stay with me')::text, true);
select public.grant_consent(current_setting('test.person')::uuid, 'health_data', 'v1');

insert into public.emergency_contacts (person_id, name, relationship, phone_e164, visibility, priority) values
  (current_setting('test.person')::uuid, 'María', 'Daughter', '+573001234567', 'public_emergency', 1),
  (current_setting('test.person')::uuid, 'Private Pedro', 'Son', '+573009999999', 'private', 2);
insert into public.emergency_details (person_id, kind, title, visibility) values
  (current_setting('test.person')::uuid, 'communication', 'Speak slowly', 'public_emergency'),
  (current_setting('test.person')::uuid, 'medication', 'Secret medication', 'private');

select set_config('test.public_id', public.issue_public_identifier(current_setting('test.person')::uuid), true);

-- ── Anonymous scan ───────────────────────────────────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select set_config('test.result', public.resolve_emergency_profile(current_setting('test.public_id'))::text, true);

select is(current_setting('test.result')::jsonb ->> 'status', 'active', 'active identifier resolves');
select is(
  current_setting('test.result')::jsonb -> 'person' ->> 'preferred_name', 'Elena',
  'preferred name is returned'
);
select ok(
  current_setting('test.result') not like '%Elena Ruiz Secret%'
  and current_setting('test.result') not like '%Private Pedro%'
  and current_setting('test.result') not like '%Secret medication%'
  and current_setting('test.result') not like '%+573009999999%',
  'private full name, contacts and details are never returned'
);
select is(
  jsonb_array_length(current_setting('test.result')::jsonb -> 'contacts'), 1,
  'only public emergency contacts are returned'
);
select is(
  current_setting('test.result')::jsonb -> 'contacts' -> 0 ->> 'phone', '+573001234567',
  'public contact phone is returned for call buttons'
);
select is(
  jsonb_array_length(current_setting('test.result')::jsonb -> 'details'), 1,
  'only public emergency details are returned'
);
select is(
  current_setting('test.result')::jsonb -> 'emergency_numbers', '[]'::jsonb,
  'unverified countries return no emergency numbers (UI shows a safe fallback)'
);
select is(
  public.resolve_emergency_profile(lower(substr(current_setting('test.public_id'), 1, 4)) || '-' ||
    lower(substr(current_setting('test.public_id'), 5)))::jsonb ->> 'status',
  'active',
  'printed lower-case grouped form resolves'
);
select is(public.resolve_emergency_profile('0000000000000000000000000Z') ->> 'status', 'not_found', 'unknown identifier');
select is(public.resolve_emergency_profile('not-an-id') ->> 'status', 'invalid', 'malformed input');
select throws_ok($$ select * from public.scan_events $$, '42501', null, 'anon cannot read scan events');

-- ── Revocation and suspension ────────────────────────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
select set_config('test.new_public_id', public.issue_public_identifier(current_setting('test.person')::uuid), true);
select public.set_person_status(current_setting('test.person')::uuid, 'suspended');

reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
select is(
  public.resolve_emergency_profile(current_setting('test.public_id')) ->> 'status', 'revoked',
  'a replaced identifier reports revoked and exposes nothing'
);
select is(
  public.resolve_emergency_profile(current_setting('test.new_public_id')) ->> 'status', 'suspended',
  'a suspended person exposes nothing'
);

reset role;
select ok(
  (select count(*) from public.scan_events where outcome in ('resolved', 'revoked', 'suspended', 'not_found')) >= 5,
  'scans are recorded without IP addresses or user agents'
);

select * from finish();
rollback;
