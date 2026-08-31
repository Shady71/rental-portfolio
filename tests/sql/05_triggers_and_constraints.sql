-- =============================================================
-- D-01 .. D-04 — signup trigger, uniqueness, and check constraints
-- Run one section at a time (select its text, or run the whole file).
--
-- These test schema-level guarantees, not per-user permissions, so
-- (unlike the A-series) they run as the SQL Editor's default
-- connection — do NOT add `set local role authenticated` here.
--
-- Placeholder (replace the {{...}} token, keep the quotes):
--   {{LANDLORD_A_ID}} -- Landlord A's auth user id (used as owner_id
--                        for throwaway fixture properties)
-- See tests/sql/README.md for how to obtain this.
-- Every section is wrapped in begin/rollback: nothing here persists.
-- =============================================================

-- ============ D-01: signup trigger creates a profile ============
-- Expected: 1 row — role = 'tenant', full_name = 'D-01 Trigger Test'.
-- This proves handle_new_user() fired on the auth.users insert.
--
-- NOTE: auth.users has a few more NOT NULL columns on some Supabase
-- project versions. If this errors naming a missing column, add it
-- to the column list with any placeholder value and re-run — the
-- rollback discards it regardless of what you add.
begin;

create temporary table tmp_d01 (user_id uuid) on commit drop;

with ins as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'd01-trigger-test@example.com',
    'not-a-real-hash',
    '{"provider":"email","providers":["email"]}',
    '{"role":"tenant","full_name":"D-01 Trigger Test"}',
    now(), now()
  )
  returning id
)
insert into tmp_d01 (user_id)
select id from ins;

select p.id, p.role, p.full_name
from public.profiles p
join tmp_d01 t on t.user_id = p.id;

rollback;

-- ============ D-02: duplicate month charge is rejected ============
-- Expected: ERROR 23505 — "duplicate key value violates unique
-- constraint \"rent_charges_property_id_period_key\"".
-- FALSE PASS WARNING: if the error names a different constraint (or a
-- different table), this did not test what it claims to.
begin;

create temporary table tmp_d02 (property_id uuid) on commit drop;

with ins as (
  insert into public.properties (owner_id, address, monthly_rent, status)
  values ('{{LANDLORD_A_ID}}', 'D-02 Fixture Property', 1000, 'occupied')
  returning id
)
insert into tmp_d02 (property_id)
select id from ins;

insert into public.rent_charges (property_id, period, amount_due, due_date)
select property_id, '2026-01-01', 1000, '2026-01-10' from tmp_d02;

-- Second charge, same property + period:
insert into public.rent_charges (property_id, period, amount_due, due_date)
select property_id, '2026-01-01', 1000, '2026-01-10' from tmp_d02;

rollback;

-- ============ D-03: invalid expense category is rejected ============
-- Expected: ERROR 23514 — "new row for relation \"expenses\" violates
-- check constraint \"expenses_category_check\"".
-- FALSE PASS WARNING: if the error names a different constraint (or a
-- different table), this did not test what it claims to.
begin;

create temporary table tmp_d03 (property_id uuid) on commit drop;

with ins as (
  insert into public.properties (owner_id, address, monthly_rent, status)
  values ('{{LANDLORD_A_ID}}', 'D-03 Fixture Property', 1000, 'occupied')
  returning id
)
insert into tmp_d03 (property_id)
select id from ins;

insert into public.expenses (property_id, amount, category, incurred_on)
select property_id, 100, 'not_a_real_category', current_date from tmp_d03;

rollback;

-- ============ D-04: invalid property status is rejected ============
-- Expected: ERROR 23514 — "new row for relation \"properties\" violates
-- check constraint \"properties_status_check\"".
-- FALSE PASS WARNING: if the error names a different constraint (or a
-- different table), this did not test what it claims to.
begin;

insert into public.properties (owner_id, address, monthly_rent, status)
values ('{{LANDLORD_A_ID}}', 'D-04 Fixture Property', 1000, 'not_a_real_status');

rollback;
