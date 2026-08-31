-- =============================================================
-- A-07, A-08 — profile update boundaries
-- Run one section at a time (select its text, or run the whole file).
-- Placeholders (replace the {{...}} token, keep the quotes):
--   {{TENANT_A_ID}} -- Tenant A's auth user id
-- See tests/sql/README.md for how to obtain this.
-- Every section is wrapped in begin/rollback: nothing here persists.
-- =============================================================

-- ============ A-07 (sanity check): impersonation is in effect ============
-- Run this first, on its own, so its result is visible before the
-- expected-error block below. Note: unlike most other tests, A-07's
-- failure is enforced by a column-level privilege revoke (see
-- supabase/schema.sql:143-144), not by auth.uid()-based RLS — so it
-- would fail with the same error even under broken impersonation. This
-- check is still worth running, since the WHERE clause below does rely
-- on matching the right id, and it's the intended positive control for
-- both this test and A-08 (same row, an allowed column).
-- Expected: impersonated_as = {{TENANT_A_ID}}.
begin;

set local role authenticated;
set local request.jwt.claims to '{"sub":"{{TENANT_A_ID}}","role":"authenticated"}';

select auth.uid() as impersonated_as;

rollback;

-- ============ A-07: tenant cannot self-promote role ============
-- Expected: ERROR 42501 — "permission denied for column \"role\" of
-- relation \"profiles\"". profiles has a table-wide UPDATE revoke from
-- `authenticated`, with only (full_name, currency) granted back
-- column-by-column — role is not among them, so this fails at the
-- privilege layer before RLS is even reached (see
-- supabase/schema.sql:143-144).
-- FALSE PASS WARNING: if the error names any column other than "role"
-- (or any relation other than "profiles"), this did not test what it
-- claims to — check the placeholder id and re-run.
begin;

set local role authenticated;
set local request.jwt.claims to '{"sub":"{{TENANT_A_ID}}","role":"authenticated"}';

update public.profiles set role = 'landlord' where id = '{{TENANT_A_ID}}';

rollback;

-- ============ A-08: tenant CAN update their own full_name ============
-- Expected: 1 row returned, id = {{TENANT_A_ID}}, impersonated_as =
-- {{TENANT_A_ID}}, full_name = 'A-08 Test Name'. This doubles as the
-- positive control for A-07: same row, a different (permitted) column
-- — 0 rows here would mean impersonation itself is broken, not that
-- write access is correctly denied.
begin;

set local role authenticated;
set local request.jwt.claims to '{"sub":"{{TENANT_A_ID}}","role":"authenticated"}';

update public.profiles
set full_name = 'A-08 Test Name'
where id = '{{TENANT_A_ID}}'
returning id, auth.uid() as impersonated_as, full_name;

rollback;
