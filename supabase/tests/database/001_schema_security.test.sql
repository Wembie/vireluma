-- Structural security guarantees that must hold for every future migration.
begin;
select plan(9);

select is(
  (select count(*)::int from pg_tables
   where schemaname in ('public', 'private') and not rowsecurity),
  0,
  'Row Level Security is enabled on every table in public and private'
);

select is(
  (select coalesce(array_agg(distinct table_name || ':' || privilege_type order by table_name || ':' || privilege_type), '{}')
   from information_schema.role_table_grants
   where grantee = 'anon' and table_schema = 'public'),
  array['emergency_numbers:SELECT']::text[],
  'anon can only SELECT emergency_numbers'
);

select is(
  (select coalesce(array_agg(p.proname::text order by p.proname), '{}')
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')),
  array['resolve_emergency_profile']::text[],
  'anon can only execute the emergency resolver'
);

select is(
  (select count(*)::int from information_schema.role_table_grants
   where grantee in ('anon', 'authenticated') and table_schema = 'private'),
  0,
  'API roles have no table privileges in the private schema'
);

select is(
  (select coalesce(array_agg(p.proname::text order by p.proname), '{}')
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname in ('public', 'private') and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')),
  '{}'::text[],
  'every SECURITY DEFINER function pins its search_path'
);

select is(
  (select count(*)::int from information_schema.column_privileges
   where grantee = 'authenticated' and table_name = 'invitations' and column_name = 'token_hash'),
  0,
  'invitation token hashes are not readable through the API'
);

-- Identifier generation
select ok(
  (select bool_and(private.generate_public_id() ~ '^[0-9A-HJKMNP-TV-Z]{26}$') from generate_series(1, 500)),
  'generated identifiers are 26-symbol Crockford base32'
);

select is(
  (select count(distinct private.generate_public_id())::int from generate_series(1, 5000)),
  5000,
  'generated identifiers do not collide across 5000 draws'
);

select is(
  array[
    private.normalize_public_id('abcd-efgh-jkmn-pqrs-tvwx-yz01-23'),
    private.normalize_public_id('OI' || repeat('A', 24)),
    private.normalize_public_id('U' || repeat('A', 25)),
    private.normalize_public_id(repeat('A', 100)),
    private.normalize_public_id(null)
  ],
  array['ABCDEFGHJKMNPQRSTVWXYZ0123', '01' || repeat('A', 24), null, null, null],
  'identifier normalisation matches @vireluma/domain parsePublicId'
);

select * from finish();
rollback;
